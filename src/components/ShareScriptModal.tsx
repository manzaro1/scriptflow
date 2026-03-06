"use client";

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Mail, Link, Copy, Check, Trash2, Loader2 } from 'lucide-react';
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/utils/security";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShareScriptModalProps {
  scriptId: string;
  scriptTitle?: string;
  inviterName?: string;
  children?: React.ReactNode;
}

const ShareScriptModal = ({ scriptId, scriptTitle, inviterName, children }: ShareScriptModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const shareLink = `${window.location.origin}/editor?id=${scriptId}`;

  const fetchCollaborators = async () => {
    const { data, error } = await supabase
      .from('script_collaborators')
      .select('*')
      .eq('script_id', scriptId);
    
    if (!error && data) setCollaborators(data);
  };

  useEffect(() => {
    if (scriptId) fetchCollaborators();
  }, [scriptId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    try {
      const sanitizedEmail = sanitizeInput(email.toLowerCase());
      const { error } = await supabase
        .from('script_collaborators')
        .insert({
          script_id: scriptId,
          email: sanitizedEmail,
          role: role
        });

      if (error) throw error;

      // Send invitation email via Resend edge function
      const scriptUrl = `${window.location.origin}/editor?id=${encodeURIComponent(scriptId)}`;
      supabase.functions.invoke('send-invite-email', {
        body: {
          to: sanitizedEmail,
          inviterName: sanitizeInput(inviterName || 'A ScriptFlow user'),
          scriptTitle: sanitizeInput(scriptTitle || 'Untitled Script'),
          role,
          scriptUrl,
        },
      }).catch(() => {
        // Email delivery is best-effort; the DB invite is the source of truth
      });

      showSuccess(`Invitation sent to ${email}`);
      setEmail('');
      fetchCollaborators();
    } catch (err: any) {
      console.error("[ShareScriptModal]", err);
      showError("Failed to send invitation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeCollaborator = async (id: string) => {
    try {
      const { error } = await supabase
        .from('script_collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess("Access revoked");
      fetchCollaborators();
    } catch (err: any) {
      showError("Failed to revoke access");
    }
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
            Invite others to collaborate or share a secure link.
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
                    className="flex-1"
                  />
                  <Select value={role} onValueChange={(v: any) => setRole(v)}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
                </Button>
              </div>
              
              {collaborators.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase font-bold">Collaborators</Label>
                  <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
                    {collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[150px]">{collab.email}</span>
                          <span className="text-[10px] uppercase text-muted-foreground">{collab.role}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeCollaborator(collab.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  className="bg-muted text-xs"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink} className="shrink-0">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Only authenticated users with explicitly granted roles can access this link.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareScriptModal;