"use client";

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UserPlus, Sparkles } from 'lucide-react';
import { showSuccess } from "@/utils/toast";

const CharacterProfileModal = ({ onSave }: { onSave?: (char: any) => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess("Character profile synchronized with AI engine.");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-dashed">
          <UserPlus size={16} />
          Define Persona
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <DialogTitle>Character DNA</DialogTitle>
              <DialogDescription>
                Define the core traits that drive this character's behavior.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="char-name">Full Name</Label>
              <Input id="char-name" placeholder="e.g. Detective Miller" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="char-role">Archetype / Role</Label>
              <Select defaultValue="Protagonist">
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Protagonist">Protagonist</SelectItem>
                  <SelectItem value="Antagonist">Antagonist</SelectItem>
                  <SelectItem value="Villain">Villain</SelectItem>
                  <SelectItem value="Supporting">Supporting</SelectItem>
                  <SelectItem value="Minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="char-age">Age</Label>
              <Input id="char-age" type="number" placeholder="35" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="char-nationality">Nationality</Label>
              <Input id="char-nationality" placeholder="e.g. British" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="char-skin">Skin Tone/Features</Label>
              <Input id="char-skin" placeholder="e.g. Olive" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="char-motivation">Core Motivation (Reason for being in film)</Label>
            <Textarea 
              id="char-motivation" 
              placeholder="What drives every decision they make?"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="char-traits">Personality Traits (Comma separated)</Label>
            <Input id="char-traits" placeholder="Stoic, Cunning, Loyal, Impulsive" />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Forge Character</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CharacterProfileModal;