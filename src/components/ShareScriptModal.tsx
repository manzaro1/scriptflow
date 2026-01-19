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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Mail, Link, Copy, Check } from 'lucide-react';
import { showSuccess } from "@/utils/toast";

const ShareScriptModal = ({ children }: { children?: React.ReactNode }) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const shareLink = "https://scriptflow.app/share/neon-horizon-42k";

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    showSuccess(`Invitation sent to ${email}`);
    setEmail('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    showSuccess("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 size={16} />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Script</DialogTitle>
          <DialogDescription>
            Invite others to collaborate or share a read-only link.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail size={14} />
              Email
            </TabsTrigger>
            <TabsTrigger value="link" className="gap-2">
              <Link size={14} />
              Link
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4 py-4">
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Invite by Email</Label>
                <div className="flex gap-2">
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="collaborator@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit">Invite</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Recent Collaborators</Label>
                <div className="flex flex-col gap-2">
                  {['John Director', 'Sarah Producer'].map((name) => (
                    <div key={name} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
                      <span>{name}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Revoke</Button>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link">Shareable Link</Label>
              <div className="flex gap-2">
                <Input 
                  id="link" 
                  readOnly 
                  value={shareLink}
                  className="bg-muted"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Anyone with this link can view the script. You can change permissions in settings.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareScriptModal;