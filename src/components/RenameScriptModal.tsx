"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSuccess } from "@/utils/toast";

interface RenameScriptModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: string;
  onRename: (newTitle: string) => void;
}

const RenameScriptModal = ({ isOpen, onOpenChange, currentTitle, onRename }: RenameScriptModalProps) => {
  const [newTitle, setNewTitle] = useState(currentTitle);

  useEffect(() => {
    setNewTitle(currentTitle);
  }, [currentTitle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || newTitle === currentTitle) {
      onOpenChange(false);
      return;
    }
    
    onRename(newTitle.trim());
    showSuccess(`Script renamed to "${newTitle.trim()}"`);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Script</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Script Title</Label>
            <Input 
              id="title" 
              value={newTitle} 
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter new title..."
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!newTitle.trim() || newTitle === currentTitle}>
              Save Title
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameScriptModal;