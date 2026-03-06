"use client";

import React, { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, UserPlus, ArrowRight, ArrowLeft, Check, Sparkles, FileText, Edit3, Loader2 } from 'lucide-react';
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/utils/security";
import ScriptUpload from "./ScriptUpload";

const NewScriptModal = ({ children, onComplete }: { children?: React.ReactNode, onComplete?: () => void }) => {
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [creationMode, setCreationMode] = useState<'scratch' | 'upload'>('scratch');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Script form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('Alex Rivers');
  const [genre, setGenre] = useState('sci-fi');
  
  // Character form state
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState('Protagonist');
  const [charAge, setCharAge] = useState('');
  const [charNationality, setCharNationality] = useState('');
  const [charSkin, setCharSkin] = useState('');
  const [charMotivation, setCharMotivation] = useState('');

  const addCharacter = () => {
    if (!charName) return;
    setCharacters([...characters, { 
      name: charName, 
      role: charRole, 
      age: charAge, 
      nationality: charNationality, 
      skin: charSkin, 
      motivation: charMotivation 
    }]);
    // Reset char form
    setCharName('');
    setCharAge('');
    setCharNationality('');
    setCharSkin('');
    setCharMotivation('');
  };

  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showError("You must be logged in to create a script.");
        setIsCreating(false);
        return;
      }

      // Initial script content
      const initialContent = [
        { id: '1', type: 'slugline', content: 'EXT. NEW SCENE - DAY' },
        { id: '2', type: 'action', content: 'The story begins here...' }
      ];

      const { error } = await supabase
        .from('scripts')
        .insert({
          user_id: user.id,
          title: sanitizeInput(title) || 'Untitled Screenplay',
          author: sanitizeInput(author) || 'Anonymous',
          genre: sanitizeInput(genre),
          content: initialContent,
          status: 'Draft'
        });

      if (error) throw error;

      showSuccess(creationMode === 'upload' 
        ? `Script imported from "${uploadedFile?.name}" successfully.`
        : `Script "${title || 'Untitled'}" created successfully.`);
      
      if (onComplete) onComplete();
      
      setIsOpen(false);
      setStep(1);
      setCharacters([]);
      setUploadedFile(null);
      setTitle('');
    } catch (err: any) {
      console.error("[NewScriptModal]", err);
      showError("Failed to create script. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Plus size={16} />
            Create New
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-primary text-primary-foreground p-1 rounded">
              <Sparkles size={16} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {step} of 2</span>
          </div>
          <DialogTitle>
            {step === 1 
              ? (creationMode === 'scratch' ? "Start New Screenplay" : "Import Existing Script") 
              : "Cast & Character DNA"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? (creationMode === 'scratch' ? "Enter the basic details for your new project." : "Upload your script and our AI will parse the structure automatically.")
              : "Define the actors that will drive your narrative. This helps the AI maintain behavior."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 py-4">
            <Tabs 
              defaultValue="scratch" 
              className="w-full" 
              onValueChange={(v) => setCreationMode(v as 'scratch' | 'upload')}
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="scratch" className="gap-2">
                  <Edit3 size={14} />
                  Start from Scratch
                </TabsTrigger>
                <TabsTrigger value="upload" className="gap-2">
                  <FileText size={14} />
                  Upload Document
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="scratch" className="space-y-4 pt-0">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Untitled Screenplay" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="author">Author</Label>
                  <Input 
                    id="author" 
                    placeholder="Your Name" 
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select value={genre} onValueChange={setGenre}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="action">Action</SelectItem>
                        <SelectItem value="comedy">Comedy</SelectItem>
                        <SelectItem value="drama">Drama</SelectItem>
                        <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="format">Template</Label>
                    <Select defaultValue="standard">
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard Screenplay</SelectItem>
                        <SelectItem value="stage">Stage Play</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4 pt-0">
                <ScriptUpload onFileSelect={setUploadedFile} />
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="upload-title">Title (Optional)</Label>
                  <Input id="upload-title" placeholder={uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, "") : "Document Title"} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg border border-dashed space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <UserPlus size={16} />
                Add Initial Character
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]" htmlFor="c-name">Name</Label>
                  <Input id="c-name" value={charName} onChange={e => setCharName(e.target.value)} placeholder="Name" className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Role</Label>
                  <Select value={charRole} onValueChange={setCharRole}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Protagonist">Protagonist</SelectItem>
                      <SelectItem value="Antagonist">Antagonist</SelectItem>
                      <SelectItem value="Villain">Villain</SelectItem>
                      <SelectItem value="Supporting">Supporting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px]">Age</Label>
                  <Input value={charAge} onChange={e => setCharAge(e.target.value)} type="number" placeholder="Age" className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Nationality</Label>
                  <Input value={charNationality} onChange={e => setCharNationality(e.target.value)} placeholder="Nationality" className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Skin Tone</Label>
                  <Input value={charSkin} onChange={e => setCharSkin(e.target.value)} placeholder="Tone" className="h-8" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Motivation / Reason in Film</Label>
                <Textarea 
                  value={charMotivation} 
                  onChange={e => setCharMotivation(e.target.value)}
                  placeholder="What is their primary goal?" 
                  className="min-h-[60px] text-xs" 
                />
              </div>
              <Button type="button" size="sm" className="w-full" onClick={addCharacter}>Add Actor to Script</Button>
            </div>

            {characters.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Added Characters ({characters.length})</Label>
                <div className="grid grid-cols-2 gap-2">
                  {characters.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-primary/5 border border-primary/10 rounded-md">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground">{c.role}</span>
                      </div>
                      <Check size={14} className="text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
          {step === 1 ? (
            <>
              <div />
              <Button 
                onClick={() => setStep(2)} 
                className="gap-2"
                disabled={creationMode === 'scratch' && (!title || !author)}
              >
                Next: Add Characters
                <ArrowRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} className="gap-2" disabled={isCreating}>
                <ArrowLeft size={16} />
                Back
              </Button>
              <Button 
                onClick={handleCreate} 
                disabled={isCreating}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    {creationMode === 'upload' ? 'Import Script' : 'Create Script'}
                    <Check size={16} />
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewScriptModal;