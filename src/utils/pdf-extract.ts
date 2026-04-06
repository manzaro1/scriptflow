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

  // Set worker source — use Vite's URL resolution for the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();

  let pdf: any;
  try {
    pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  } catch (e: any) {
    console.error('[PDF Extract] getDocument error:', e);
    throw new Error('Failed to open PDF. The file may be corrupted or password-protected.');
  }

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    // Reconstruct line breaks by detecting Y-position changes between text items.
    // PDF text items on the same line share similar Y coords; a significant Y change = new line.
    const items = textContent.items as any[];
    if (items.length === 0) continue;

    const lines: string[] = [];
    let currentLine = '';
    let lastY: number | null = null;

    for (const item of items) {
      const y = item.transform ? item.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        // Y position changed significantly — new line
        if (currentLine.trim()) {
          lines.push(currentLine.trimEnd());
        } else {
          lines.push(''); // preserve blank lines for paragraph separation
        }
        currentLine = item.str;
      } else {
        // Same line — check if we need a space between items
        if (currentLine && item.str && !currentLine.endsWith(' ') && !item.str.startsWith(' ')) {
          // Add space between items on the same line if there's a gap
          const hasGap = item.transform && lastY !== null ? (item.width !== undefined) : true;
          currentLine += (hasGap ? ' ' : '') + item.str;
        } else {
          currentLine += item.str;
        }
      }
      if (y !== null) lastY = y;
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trimEnd());
    }

    const pageText = lines.join('\n');
    if (pageText.trim()) {
      pages.push(pageText);
    }
  }

  const fullText = pages.join('\n\n');
  if (!fullText.trim()) {
    throw new Error('No text found in PDF. The file may be image-based (scanned). Try a text-based PDF or TXT file.');
  }

  return fullText;
}

/**
 * Extract text from a TXT file.
 */
async function extractTxtText(file: File): Promise<string> {
  return await file.text();
}

/**
 * Extract text from a DOCX file by parsing the XML inside the ZIP.
 * DOCX files are ZIP archives containing word/document.xml with the text content.
 */
async function extractDocxText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Find the word/document.xml entry in the ZIP
    // ZIP files have local file headers starting with PK\x03\x04
    const xmlContent = await extractXmlFromZip(uint8, 'word/document.xml');
    if (!xmlContent) {
      throw new Error('Could not find document.xml in DOCX file');
    }

    // Parse XML to extract text content
    // DOCX uses <w:t> tags for text and <w:p> tags for paragraphs
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    const paragraphs: string[] = [];
    const pElements = doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p');

    for (let i = 0; i < pElements.length; i++) {
      const tElements = pElements[i].getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 't');
      let paragraphText = '';
      for (let j = 0; j < tElements.length; j++) {
        paragraphText += tElements[j].textContent || '';
      }
      paragraphs.push(paragraphText);
    }

    const text = paragraphs.join('\n');
    if (!text.trim()) {
      throw new Error('No text content found in DOCX');
    }
    return text;
  } catch (err: any) {
    console.error('[extractDocxText] DOCX parsing error:', err);
    throw new Error('Failed to extract text from DOCX. ' + (err.message || ''));
  }
}

/**
 * Extract a file from a ZIP archive (minimal implementation for DOCX).
 * Uses DecompressionStream API available in modern browsers.
 */
async function extractXmlFromZip(zipData: Uint8Array, targetPath: string): Promise<string | null> {
  let offset = 0;

  while (offset < zipData.length - 4) {
    // Check for local file header signature: PK\x03\x04
    if (zipData[offset] !== 0x50 || zipData[offset + 1] !== 0x4B ||
        zipData[offset + 2] !== 0x03 || zipData[offset + 3] !== 0x04) {
      break;
    }

    const compressionMethod = zipData[offset + 8] | (zipData[offset + 9] << 8);
    const compressedSize = zipData[offset + 18] | (zipData[offset + 19] << 8) |
                           (zipData[offset + 20] << 16) | (zipData[offset + 21] << 24);
    const fileNameLength = zipData[offset + 26] | (zipData[offset + 27] << 8);
    const extraFieldLength = zipData[offset + 28] | (zipData[offset + 29] << 8);
    const fileName = new TextDecoder().decode(zipData.slice(offset + 30, offset + 30 + fileNameLength));
    const dataStart = offset + 30 + fileNameLength + extraFieldLength;

    if (fileName === targetPath) {
      const rawData = zipData.slice(dataStart, dataStart + compressedSize);

      if (compressionMethod === 0) {
        // Stored (no compression)
        return new TextDecoder().decode(rawData);
      } else if (compressionMethod === 8) {
        // Deflate — use DecompressionStream
        try {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(rawData);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
          const result = new Uint8Array(totalLength);
          let pos = 0;
          for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.length;
          }
          return new TextDecoder().decode(result);
        } catch {
          return null;
        }
      }
      return null;
    }

    offset = dataStart + compressedSize;
  }

  return null;
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
      return extractDocxText(file);
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
  console.log('[parseScreenplayText] Rule-based parse returned', ruleBasedBlocks.length, 'blocks, falling back to AI');
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
    console.error('[parseScreenplayText] AI error:', error);
    throw new Error(error === 'NO_API_KEY' ? 'Set up your AI provider in Settings > AI to use script import.' : `AI parsing failed: ${error}`);
  }

  if (!text || !text.trim()) {
    console.error('[parseScreenplayText] AI returned empty text');
    throw new Error('AI returned empty response. Please try again.');
  }

  try {
    // Clean potential markdown fences and whitespace
    let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    // Handle case where AI wraps in extra text before/after JSON array
    const arrayStart = cleaned.indexOf('[');
    const arrayEnd = cleaned.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1) {
      cleaned = cleaned.substring(arrayStart, arrayEnd + 1);
    }

    const parsed: Array<{ type: string; content: string }> = JSON.parse(cleaned);

    return parsed.map(block => ({
      id: generateId(),
      type: block.type as ScriptBlock['type'],
      content: block.content,
    }));
  } catch (parseErr) {
    console.error('[parseScreenplayText] JSON parse failed:', parseErr, 'Raw AI text:', text.substring(0, 500));
    throw new Error('Failed to parse AI response. The AI may have returned an unexpected format.');
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

  // Common transition patterns (case-insensitive)
  const transitionRegex = /^(CUT TO:|FADE (IN|OUT)[.:]|DISSOLVE TO:|SMASH CUT TO:|MATCH CUT TO:|JUMP CUT TO:|WIPE TO:|IRIS (IN|OUT)[.:]|TIME CUT:|INTERCUT:|BACK TO:|FLASH CUT TO:|THE END\.?|CONTINUED:?)$/i;

  // Slugline patterns (with or without periods, common variations)
  const sluglineRegex = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|INT |EXT |INT\/EXT )/i;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    const upper = line.toUpperCase();

    // Sluglines: INT. or EXT. (also match without period: "INT " / "EXT ")
    if (sluglineRegex.test(line)) {
      blocks.push({ id: generateId(), type: 'slugline', content: upper });
      i++;
      continue;
    }

    // Transitions: CUT TO:, FADE IN:, FADE OUT., etc.
    if (transitionRegex.test(line)) {
      blocks.push({ id: generateId(), type: 'transition', content: upper });
      i++;
      continue;
    }

    // Parenthetical: starts with ( — can appear standalone or within dialogue context
    if (line.startsWith('(') && (line.endsWith(')') || line.match(/\)$/))) {
      blocks.push({ id: generateId(), type: 'parenthetical', content: line });
      i++;
      continue;
    }

    // Character name detection:
    // - ALL CAPS text, short line (< 50 chars)
    // - May include (V.O.), (O.S.), (O.C.), (CONT'D), (CONTINUED), etc.
    // - Not a slugline, transition, or other keyword
    // - Must contain at least one letter
    const strippedAnnotation = line.replace(/\s*\((?:V\.?O\.?|O\.?S\.?|O\.?C\.?|CONT'?D?|CONTINUED|OFF ?SCREEN|OFF ?CAMERA)\)\s*$/i, '').trim();
    const isAllCaps = strippedAnnotation.length > 0 && strippedAnnotation === strippedAnnotation.toUpperCase() && /[A-Z]/.test(strippedAnnotation);
    const isCharacterName = isAllCaps && line.length < 50 && !/^(INT|EXT|CUT|FADE|DISSOLVE|SMASH|MATCH|JUMP|WIPE|IRIS|TIME|INTERCUT|BACK|FLASH|THE END|CONTINUED)/.test(upper) && !line.includes(':');

    if (isCharacterName) {
      blocks.push({ id: generateId(), type: 'character', content: line });
      i++;

      // Consume following dialogue and parenthetical lines until blank line or next character/slugline
      while (i < lines.length) {
        const nextLine = lines[i].trim();

        // Empty line ends the dialogue block
        if (!nextLine) {
          i++;
          break;
        }

        // Check if next line is a slugline — don't consume
        if (sluglineRegex.test(nextLine)) break;

        // Check if next line is a transition — don't consume
        if (transitionRegex.test(nextLine)) break;

        // Parenthetical within dialogue
        if (nextLine.startsWith('(') && nextLine.endsWith(')')) {
          blocks.push({ id: generateId(), type: 'parenthetical', content: nextLine });
          i++;
          continue;
        }

        // Check if this is another character name (start of new dialogue block)
        const nextStripped = nextLine.replace(/\s*\((?:V\.?O\.?|O\.?S\.?|O\.?C\.?|CONT'?D?|CONTINUED|OFF ?SCREEN|OFF ?CAMERA)\)\s*$/i, '').trim();
        const nextIsAllCaps = nextStripped.length > 0 && nextStripped === nextStripped.toUpperCase() && /[A-Z]/.test(nextStripped);
        if (nextIsAllCaps && nextLine.length < 50 && !nextLine.includes(':')) {
          break; // Next character, don't consume
        }

        // Otherwise it's dialogue
        blocks.push({ id: generateId(), type: 'dialogue', content: nextLine });
        i++;
      }
      continue;
    }

    // Multi-line action: collect consecutive non-empty lines that aren't other types
    let actionLines = [line];
    i++;
    while (i < lines.length) {
      const nextLine = lines[i].trim();
      // Stop at blank lines, sluglines, transitions, or character names
      if (!nextLine) break;
      if (sluglineRegex.test(nextLine)) break;
      if (transitionRegex.test(nextLine)) break;
      // Check if it looks like a character name
      const nextStripped = nextLine.replace(/\s*\((?:V\.?O\.?|O\.?S\.?|O\.?C\.?|CONT'?D?|CONTINUED|OFF ?SCREEN|OFF ?CAMERA)\)\s*$/i, '').trim();
      const nextIsCaps = nextStripped.length > 0 && nextStripped === nextStripped.toUpperCase() && /[A-Z]/.test(nextStripped) && nextLine.length < 50 && !nextLine.includes(':');
      if (nextIsCaps) break;
      actionLines.push(nextLine);
      i++;
    }
    blocks.push({ id: generateId(), type: 'action', content: actionLines.join(' ') });
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
  let rawText: string;
  try {
    rawText = await extractFileText(file);
  } catch (err: any) {
    console.error('[extractAndParseScript] Text extraction failed:', err);
    throw new Error(err.message || 'Failed to extract text from the document.');
  }

  if (!rawText.trim()) {
    throw new Error('No text could be extracted from the document.');
  }

  console.log('[extractAndParseScript] Extracted', rawText.length, 'chars of text');

  // Stage 2: Parse into blocks
  onProgress?.('Parsing screenplay structure...', 60);
  let blocks: ScriptBlock[];
  try {
    blocks = await parseScreenplayText(rawText);
  } catch (err: any) {
    console.warn('[extractAndParseScript] AI parsing failed, falling back to plain text blocks:', err.message);
    // Fallback: split text into paragraphs as action blocks
    blocks = rawText.split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => ({
        id: generateId(),
        type: 'action' as const,
        content: p,
      }));
  }

  if (blocks.length === 0) {
    throw new Error('No content could be identified in the document.');
  }

  // Extract title from filename
  const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  onProgress?.('Import complete!', 100);

  return { blocks, title };
}
