"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { api } from "@/lib/api";
import StoryboardEngine from "@/components/StoryboardEngine";

interface DashboardStoryboardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
}

type StoryboardSummaryRow = {
  script_id: string;
  title: string;
  genre: string | null;
  storyboard_count: number;
  last_generated_at: string | null;
};

const DashboardStoryboardModal = ({ isOpen, onOpenChange, onRefresh }: DashboardStoryboardModalProps) => {
  const [summary, setSummary] = useState<StoryboardSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [scriptBlocks, setScriptBlocks] = useState<any[]>([]);
  const [scriptTitle, setScriptTitle] = useState("");
  const [storyboardEngineOpen, setStoryboardEngineOpen] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchJSON<StoryboardSummaryRow[]>("/api/storyboard/summary");
      setSummary(data);
    } catch (err) {
      console.error("[DashboardStoryboard] summary", err);
      showError("Failed to load storyboard list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    }
  }, [isOpen, fetchSummary]);

  const handleGenerate = async (row: StoryboardSummaryRow) => {
    setLoading(true);
    const toastId = showLoading("Loading script details...");
    try {
      const script = await api.getScript(row.script_id);
      const blocks = Array.isArray(script.content) ? script.content : JSON.parse(script.content || "[]");
      const mapped = blocks.map((block: any, index: number) => ({
        id: block.id || `${row.script_id}-${index}`,
        type: block.type || "action",
        content: block.content || "",
      }));
      setScriptBlocks(mapped);
      setScriptTitle(script.title);
      setSelectedScriptId(row.script_id);
      setStoryboardEngineOpen(true);
    } catch (err) {
      console.error("[DashboardStoryboard] script", err);
      showError("Unable to load script content.");
    } finally {
      dismissToast(toastId);
      setLoading(false);
    }
  };

  const handleEngineClose = () => {
    setStoryboardEngineOpen(false);
    setSelectedScriptId(null);
    setScriptBlocks([]);
    if (onRefresh) onRefresh();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-[min(100vw,44rem)]">
          <DialogHeader>
            <DialogTitle>AI Storyboards</DialogTitle>
            <p className="text-sm text-muted-foreground">Select a film to generate a storyboard from the chosen script.</p>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="mt-4 space-y-3">
              {summary.map((row) => (
                <div key={row.script_id} className="border rounded-xl p-4 flex flex-col gap-2 bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{row.title}</h3>
                      <p className="text-xs text-muted-foreground">{row.genre || "No genre"}</p>
                    </div>
                    <Badge variant={row.storyboard_count ? "outline" : "secondary"}>
                      {row.storyboard_count ? "Generated" : "Needs storyboard"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last generated: {row.last_generated_at ? new Date(row.last_generated_at).toLocaleString() : "Never"}</span>
                    <Button size="sm" onClick={() => handleGenerate(row)} disabled={loading}>
                      Generate
                    </Button>
                  </div>
                </div>
              ))}
              {summary.length === 0 && !loading && (
                <div className="text-center text-sm text-muted-foreground">No scripts ready yet.</div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedScriptId && (
        <StoryboardEngine
          isOpen={storyboardEngineOpen}
          onOpenChange={(open) => { if (!open) handleEngineClose(); setStoryboardEngineOpen(open); }}
          scriptBlocks={scriptBlocks}
          scriptTitle={scriptTitle}
          scriptId={selectedScriptId}
        />
      )}
    </>
  );
};

export default DashboardStoryboardModal;
