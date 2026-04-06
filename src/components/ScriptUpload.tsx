"use client";

import React, { useState, useRef } from 'react';
import { FileUp, FileText, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/utils/toast";
import { extractAndParseScript } from "@/utils/pdf-extract";

interface ScriptUploadProps {
  onFileSelect: (file: File | null) => void;
  onExtracted?: (blocks: any[], title: string) => void;
}

const ScriptUpload = ({ onFileSelect, onExtracted }: ScriptUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [extractionDone, setExtractionDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      showError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
      return;
    }

    setFile(selectedFile);
    onFileSelect(selectedFile);
    setIsUploading(true);
    setUploadProgress(10);
    setProgressStage('Preparing file...');
    setExtractionDone(false);

    try {
      const { blocks, title } = await extractAndParseScript(selectedFile, (stage, percent) => {
        setProgressStage(stage);
        setUploadProgress(percent);
      });

      setUploadProgress(100);
      setProgressStage('Import complete!');
      setIsUploading(false);
      setExtractionDone(true);
      showSuccess(`Extracted ${blocks.length} blocks from document.`);
      onExtracted?.(blocks, title);
    } catch (err: any) {
      console.error('[ScriptUpload] extraction error:', err);
      setIsUploading(false);
      setUploadProgress(0);
      setProgressStage('');
      showError(err.message || 'Failed to extract script from document.');
      // Keep file selected so user can retry or proceed with manual entry
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUploadProgress(0);
    setProgressStage('');
    setExtractionDone(false);
    onFileSelect(null);
    onExtracted?.([], '');
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all flex flex-col items-center justify-center text-center cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
          file && extractionDone && "border-green-500/50 bg-green-50/30 dark:bg-green-950/20",
          file && !extractionDone && !isUploading && "border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/20"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          onChange={handleChange}
        />

        {!file ? (
          <>
            <div className="bg-primary/10 p-3 rounded-full mb-4">
              <FileUp className="text-primary h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm">Upload Script Document</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
              Drag & drop your .pdf, .docx, or .txt file here or click to browse
            </p>
          </>
        ) : (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between bg-background p-3 rounded-lg border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded text-blue-600 dark:text-blue-400">
                  <FileText size={18} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold truncate max-w-[200px]">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              {!isUploading ? (
                <div className="flex items-center gap-2">
                  {extractionDone && <CheckCircle2 size={16} className="text-green-500" />}
                  <button onClick={removeFile} className="p-1 hover:bg-muted rounded text-muted-foreground">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <Loader2 size={16} className="animate-spin text-primary" />
              )}
            </div>
            {(isUploading || progressStage) && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>{progressStage || 'Processing...'}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 bg-muted/50 p-3 rounded-lg border border-dashed">
        <AlertCircle size={14} className="text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          ScriptFlow will automatically extract scenes, characters, and dialogue formatting from your document using AI-powered parsing.
        </p>
      </div>
    </div>
  );
};

export default ScriptUpload;
