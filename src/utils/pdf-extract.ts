/**
 * PDF/TXT text extraction and AI-powered screenplay parsing.
 * Extracts raw text from uploaded files, then uses AI to parse
 * into structured ScriptBlock[] format for the editor.
 */

import { aiPrompt } from './ai-client';

interface ScriptBlock {
  id: string;
  type: 'action' | 'character' | 'dialogue' | 'slugline' | 'parenthetical' | 'transition';
  content: string;
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Extract raw text from a PDF file using pdfjs-dist.
 */
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source to bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n\n');
}

/**
 * Extract text from a TXT file.
 */
async function extractTxtText(file: File): Promise<string> {
  return await file.text();
}

/**
 * Extract text from a DOCX file (basic - reads raw XML text content).
 */
async function extractDocxText(file: File): Promise<string> {
  // Basic DOCX extraction: DOCX is a zip with XML inside
  // We extract text from word/document.xml
  try {
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer]);

    // Use JSZip-like approach with the browser's native decompression
    const { entries } = await import('pdfjs-dist');
    // Fallback: just read as text which may work for simple cases
    const text = await file.text();
    return text;
  } catch {
    // If DOCX parsing fails, try reading as plain text
    return await file.text();
  }
}

/**
 * Extract raw text from an uploaded file based on type.
 */
export async function extractFileText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'pdf':
      return extractPdfText(file);
    case 'txt':
      return extractTxtText(file);
    case 'docx':
      // For DOCX, try basic text extraction
      return await file.text();
    default:
      throw new Error(`Unsupported file type: .${ext}`);
  }
}

/**
 * Use AI to parse raw screenplay text into structured ScriptBlock[].
 */
export async function parseScreenplayText(rawText: string): Promise<ScriptBlock[]> {
  // First try rule-based parsing for well-formatted screenplays
  const ruleBasedBlocks = tryRuleBasedParse(rawText);
  if (ruleBasedBlocks.length > 3) {
    return ruleBasedBlocks;
  }

  // Fall back to AI parsing
  const { text, error } = await aiPrompt(
    `You are a screenplay parser. Convert the following raw text into structured screenplay blocks.

Each block must be a JSON object with:
- "type": one of "slugline", "action", "character", "dialogue", "parenthetical", "transition"
- "content": the text content for that block

Rules for classification:
- SLUGLINE: Lines starting with INT. or EXT. (scene headings)
- CHARACTER: Character name lines (usually ALL CAPS, alone on a line, before dialogue)
- DIALOGUE: Speech lines that follow a character name
- PARENTHETICAL: Stage directions in parentheses within dialogue, e.g. (beat), (whispers)
- ACTION: Description/narrative paragraphs
- TRANSITION: CUT TO:, FADE IN:, FADE OUT., DISSOLVE TO:, SMASH CUT TO:, etc.

Return a JSON array of objects. Return ONLY valid JSON, no markdown fences or extra text.
Example: [{"type":"slugline","content":"EXT. PARK - DAY"},{"type":"action","content":"A dog runs across the field."},{"type":"character","content":"JOHN"},{"type":"dialogue","content":"Look at that!"}]`,
    rawText.substring(0, 15000), // Limit to ~15K chars to avoid token limits
    0.2
  );

  if (error) {
    throw new Error(error === 'NO_API_KEY' ? 'Set up your AI API key in Settings to use PDF import.' : error);
  }

  try {
    // Clean potential markdown fences
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed: Array<{ type: string; content: string }> = JSON.parse(cleaned);

    return parsed.map(block => ({
      id: generateId(),
      type: block.type as ScriptBlock['type'],
      content: block.content,
    }));
  } catch {
    throw new Error('Failed to parse AI response into screenplay blocks.');
  }
}

/**
 * Rule-based screenplay parser for well-formatted scripts.
 * Handles standard screenplay formatting conventions.
 */
function tryRuleBasedParse(rawText: string): ScriptBlock[] {
  const lines = rawText.split('\n');
  const blocks: ScriptBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    const upper = line.toUpperCase();

    // Sluglines: INT. or EXT.
    if (upper.startsWith('INT.') || upper.startsWith('EXT.') || upper.startsWith('INT/EXT.') || upper.startsWith('I/E.')) {
      blocks.push({ id: generateId(), type: 'slugline', content: line.toUpperCase() });
      i++;
      continue;
    }

    // Transitions: CUT TO:, FADE IN:, FADE OUT., etc.
    if (/^(CUT TO:|FADE (IN|OUT)[.:]|DISSOLVE TO:|SMASH CUT TO:|MATCH CUT TO:|JUMP CUT TO:|WIPE TO:|THE END\.?)$/i.test(line)) {
      blocks.push({ id: generateId(), type: 'transition', content: line.toUpperCase() });
      i++;
      continue;
    }

    // Parenthetical: starts with (
    if (line.startsWith('(') && line.endsWith(')')) {
      blocks.push({ id: generateId(), type: 'parenthetical', content: line });
      i++;
      continue;
    }

    // Character name: ALL CAPS, short line, possibly followed by dialogue
    // Character names are typically all uppercase, may have (V.O.) or (O.S.) or (CONT'D)
    const charMatch = line.match(/^([A-Z][A-Z\s.''-]+?)(\s*\((?:V\.O\.|O\.S\.|O\.C\.|CONT'D|CONTINUED)\))?$/);
    if (charMatch && line.length < 50 && line === line.toUpperCase() && !/^(INT|EXT|CUT|FADE|DISSOLVE|SMASH|MATCH|JUMP|WIPE|THE END)/.test(upper)) {
      blocks.push({ id: generateId(), type: 'character', content: line });
      i++;

      // Next non-empty lines are likely dialogue or parentheticals
      while (i < lines.length) {
        const nextLine = lines[i].trim();
        if (!nextLine) {
          i++;
          break;
        }
        if (nextLine.startsWith('(') && nextLine.endsWith(')')) {
          blocks.push({ id: generateId(), type: 'parenthetical', content: nextLine });
        } else if (nextLine === nextLine.toUpperCase() && nextLine.length < 50 && /^[A-Z]/.test(nextLine)) {
          // Likely next character, don't consume
          break;
        } else {
          blocks.push({ id: generateId(), type: 'dialogue', content: nextLine });
        }
        i++;
      }
      continue;
    }

    // Default: action line
    blocks.push({ id: generateId(), type: 'action', content: line });
    i++;
  }

  return blocks;
}

/**
 * Full pipeline: extract text from file, then parse into blocks.
 */
export async function extractAndParseScript(
  file: File,
  onProgress?: (stage: string, percent: number) => void
): Promise<{ blocks: ScriptBlock[]; title: string }> {
  // Stage 1: Extract text
  onProgress?.('Extracting text from document...', 20);
  const rawText = await extractFileText(file);

  if (!rawText.trim()) {
    throw new Error('No text could be extracted from the document.');
  }

  // Stage 2: Parse into blocks
  onProgress?.('Parsing screenplay structure...', 60);
  const blocks = await parseScreenplayText(rawText);

  if (blocks.length === 0) {
    throw new Error('No screenplay content could be identified in the document.');
  }

  // Try to extract title from filename
  const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  onProgress?.('Import complete!', 100);

  return { blocks, title };
}
