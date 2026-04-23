"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CreditCard,
  User,
  Shield,
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Trash2,
  ShieldCheck,
  UserMinus,
  Zap,
  BrainCircuit,
  KeyRound,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  MessageCircle,
  Link2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from "@/utils/toast";
import { useAuth } from "@/hooks/use-auth";
import { sanitizeInput } from "@/utils/security";
import { AI_PROVIDERS, AIProvider, loadAIConfig, saveAIConfig } from "@/utils/ai-providers";
import { testAPIKey } from "@/utils/ai-providers";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";

const Profile = () => {
  const [globalModel, setGlobalModel] = useState("k2think");
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'account';
  const { user: currentUser } = useAuth();

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (currentUser) {
        try {
          const res = await api.getGlobalModel();
          setIsAdminUser(true);
          setGlobalModel(res.model);
        } catch {
          setIsAdminUser(false);
        }
      }
    };
    checkAdmin();
  }, [currentUser]);

  const handleModelChange = async (newModel: string) => {
    try {
      // Send as 'provider' since that's what the API expects
      await api.setGlobalModel(newModel);
      setGlobalModel(newModel);
      showSuccess(`Switched to ${newModel} model. Changes will take effect immediately in Telegram.`);
    } catch (err: any) {
      showError("Failed to switch model");
    }
  };

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [inviteScriptId, setInviteScriptId] = useState('');
  const [scripts, setScripts] = useState<any[]>([]);

  // AI key state
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('server');
  const [aiModel, setAiModel] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);

  // Team members — real data from API
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  // Telegram linking state
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramLinkCode, setTelegramLinkCode] = useState('');
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [loadingTelegram, setLoadingTelegram] = useState(false);


  useEffect(() => {
    const fetchKeyStatus = async () => {
      if (currentUser) {
        const aiConfig = loadAIConfig();
        setAiProvider(aiConfig.provider);
        setAiKeyInput(aiConfig.apiKey);
        setAiModel(aiConfig.model);
        setCustomBaseUrl(aiConfig.baseUrl || '');
        if (aiConfig.apiKey || aiConfig.baseUrl || aiConfig.provider === 'server') {
          setHasKey(true);
        }
      }
      setLoadingKey(false);
    };
    fetchKeyStatus();
  }, [currentUser]);

  const fetchTeamMembers = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const data = await api.getAllCollaborators();
      setTeamMembers(data);
    } catch {
      // silently fail
    } finally {
      setLoadingTeam(false);
    }
  }, []);

  const fetchScripts = useCallback(async () => {
    try {
      const data = await api.getScripts();
      setScripts(data || []);
      if (data?.length > 0 && !inviteScriptId) {
        setInviteScriptId(data[0].id);
      }
    } catch {
      // silently fail
    }
  }, [inviteScriptId]);

  useEffect(() => {
    if (currentUser) {
      fetchTeamMembers();
      fetchScripts();
    }
  }, [currentUser, fetchTeamMembers, fetchScripts]);
  // Check telegram link status
  useEffect(() => {
    const checkTelegram = async () => {
      if (!currentUser) return;
      try {
        const res = await api.getTelegramStatus();
        setTelegramLinked(res.linked);
        if (res.username) setTelegramUsername(res.username);
      } catch (e) {
        // Not linked or error
      }
    };
    checkTelegram();
  }, [currentUser]);


  const handleSaveKey = async () => {
    const providerInfo = AI_PROVIDERS.find(p => p.id === aiProvider);
    const model = aiModel || providerInfo?.defaultModel || '';

    if (aiProvider === 'server') {
      saveAIConfig({ provider: 'server', apiKey: '', model: '' });
      setHasKey(true);
      showSuccess('Using built-in ScriptFlow AI');
      return;
    }

    if (aiProvider === 'custom') {
      if (!customBaseUrl.trim()) {
        showError("Please enter a base URL for custom API");
        return;
      }
    } else if (!aiKeyInput.trim()) {
      showError("Please enter an API key");
      return;
    }

    saveAIConfig({
      provider: aiProvider,
      apiKey: aiKeyInput.trim(),
      model: model,
      baseUrl: aiProvider === 'custom' ? customBaseUrl.trim() : undefined,
    });

    setHasKey(true);
    setTestResult(null);
    showSuccess(`API key saved for ${providerInfo?.name}`);
  };

  const handleRemoveKey = async () => {
    saveAIConfig({ provider: 'server', apiKey: '', model: '' });
    setAiKeyInput('');
    setAiProvider('server');
    setHasKey(false);
    setTestResult(null);
    showSuccess("Switched back to built-in ScriptFlow AI");
  };

  const handleTestKey = async () => {
    const key = aiKeyInput.trim();
    if (!key && aiProvider !== 'server') {
      showError("Enter a key first");
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    const ok = await testAPIKey(aiProvider, key, customBaseUrl || undefined);
    setTestingKey(false);
    setTestResult(ok ? 'success' : 'error');
    if (ok) {
      showSuccess("API key is valid");
    } else {
      showError("API key is invalid or expired");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteScriptId) {
      showError("Please select a script and enter an email");
      return;
    }
    setInviteLoading(true);

    try {
      // Add collaborator to database
      await api.addCollaborator(inviteScriptId, sanitizeInput(inviteEmail.toLowerCase()), inviteRole as 'editor' | 'viewer');
      
      // Get script title for email
      const script = scripts.find(s => s.id === inviteScriptId);
      const scriptTitle = script?.title || 'Untitled Script';
      
      // Send invitation email
      try {
        await api.sendEmailInvite(inviteEmail.toLowerCase(), scriptTitle, inviteRole, inviteScriptId);
        showSuccess(`Invitation sent to ${sanitizeInput(inviteEmail)}`);
      } catch (emailErr) {
        // Email failed but collaborator was added
        console.error('Email send failed:', emailErr);
        showSuccess(`Collaborator added, but email failed to send. They can access the script now.`);
      }
      
      setInviteEmail('');
      fetchTeamMembers();
    } catch (err: any) {
      showError(err.message || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (collab: any) => {
    try {
      await api.removeCollaborator(collab.script_id, collab.id.toString());
      showSuccess(`${collab.email} has been removed.`);
      fetchTeamMembers();
    } catch {
      showError("Failed to remove collaborator");
    }
  };

  const handleChangeRole = async (collab: any, newRole: string) => {
    try {
      await api.updateCollaboratorRole(collab.script_id, collab.id.toString(), newRole);
      showSuccess(`Role updated to ${newRole}`);
      fetchTeamMembers();
    } catch {
      showError("Failed to update role");
    }
  };

  const userInitials = currentUser?.email?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            <header>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your account settings, billing, and team collaboration.</p>
            </header>

            <Tabs defaultValue={defaultTab} className="space-y-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="account" className="gap-2">
                  <User size={16} />
                  Account
                </TabsTrigger>
                <TabsTrigger value="teams" className="gap-2">
                  <Users size={16} />
                  Teams
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard size={16} />
                  Billing
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield size={16} />
                  Security
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2">
                  <BrainCircuit size={16} />
                  AI
                </TabsTrigger>
              </TabsList>

              {/* ==================== ACCOUNT ==================== */}
              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your account details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="text-xl font-bold">{userInitials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-lg font-semibold">{currentUser?.email || 'User'}</p>
                        <p className="text-sm text-muted-foreground">Member since {new Date().getFullYear()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" defaultValue={currentUser?.email || ""} readOnly className="bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Telegram Integration */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
                        <MessageCircle size={20} />
                      </div>
                      <div>
                        <CardTitle>Telegram Integration</CardTitle>
                        <CardDescription>Link your Telegram to chat with your script characters.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {telegramLinked ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="text-green-600 dark:text-green-400" size={20} />
                            <div>
                              <p className="font-medium">✅ Telegram Connected!</p>
                              <p className="text-sm text-muted-foreground">You can now chat with your characters</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                await api.unlinkTelegram();
                                setTelegramLinked(false);
                                setTelegramUsername('');
                                showSuccess("Telegram account unlinked");
                              } catch (err: any) {
                                showError(err.message || "Failed to unlink Telegram");
                              }
                            }}
                          >
                            Unlink
                          </Button>
                        </div>
                        
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="font-medium text-sm mb-3">📱 Available Telegram Commands:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <code className="px-1.5 py-0.5 bg-background rounded font-mono">/start</code>
                              <span className="text-muted-foreground">Get started</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="px-1.5 py-0.5 bg-background rounded font-mono">/scripts</code>
                              <span className="text-muted-foreground">List your scripts</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="px-1.5 py-0.5 bg-background rounded font-mono">/chat [name]</code>
                              <span className="text-muted-foreground">Talk to character</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="px-1.5 py-0.5 bg-background rounded font-mono">/autocomplete</code>
                              <span className="text-muted-foreground">AI suggestions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="px-1.5 py-0.5 bg-background rounded font-mono">/feedback</code>
                              <span className="text-muted-foreground">Analyze dialogue</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="px-1.5 py-0.5 bg-background rounded font-mono">/help</code>
                              <span className="text-muted-foreground">All commands</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-3">
                            💡 Try: <code className="px-1 bg-background rounded">/chat John</code> to talk to your character John!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Connect your Telegram account to chat with your characters anytime, anywhere.
                        </p>
                        {telegramError && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400">❌ {telegramError}</p>
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            placeholder="Enter code from bot..."
                            value={telegramLinkCode}
                            onChange={(e) => {
                              setTelegramLinkCode(e.target.value);
                              setTelegramError(null);
                            }}
                            className="flex-1"
                          />
                          <Button 
                            onClick={async () => {
                              if (!telegramLinkCode.trim()) {
                                setTelegramError("Please enter the code from the bot");
                                return;
                              }
                              setLoadingTelegram(true);
                              setTelegramError(null);
                              try {
                                await api.linkTelegram(telegramLinkCode.trim());
                                setTelegramLinked(true);
                                showSuccess("Telegram account linked!");
                                setTelegramLinkCode('');
                              } catch (err: any) {
                                setTelegramError(err.message || "Failed to link Telegram");
                              } finally {
                                setLoadingTelegram(false);
                              }
                            }}
                            disabled={loadingTelegram || !telegramLinkCode.trim()}
                            className="gap-2"
                          >
                            {loadingTelegram ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                            Link Account
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>1. Open Telegram and search <strong>@FlowScriptBot</strong></p>
                          <p>2. Send: <code className="px-1 bg-muted rounded">/link</code></p>
                          <p>3. Enter the code you receive here</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ==================== TEAMS ==================== */}
              <TabsContent value="teams" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invite Collaborators</CardTitle>
                    <CardDescription>Invite people to collaborate on a script.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
                      <div className="space-y-2">
                        <Label>Script</Label>
                        <Select value={inviteScriptId} onValueChange={setInviteScriptId}>
                          <SelectTrigger className="w-full sm:w-[200px]">
                            <SelectValue placeholder="Select a script" />
                          </SelectTrigger>
                          <SelectContent>
                            {scripts.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="team-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="team-email"
                            type="email"
                            className="pl-10"
                            placeholder="colleague@production.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" className="w-full sm:w-auto gap-2" disabled={inviteLoading || !inviteEmail || !inviteScriptId}>
                          {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                          Send Invite
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      {teamMembers.length === 0
                        ? "No collaborators yet. Invite people to start collaborating!"
                        : `${teamMembers.length} collaborator${teamMembers.length !== 1 ? 's' : ''} across your scripts.`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingTeam ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : teamMembers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">No team members yet.</p>
                        <p className="text-xs">Use the form above to invite collaborators to your scripts.</p>
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b">
                            <tr>
                              <th className="text-left p-3 font-medium">Member</th>
                              <th className="text-left p-3 font-medium hidden lg:table-cell">Script</th>
                              <th className="text-left p-3 font-medium hidden md:table-cell">Role</th>
                              <th className="text-left p-3 font-medium hidden sm:table-cell">Status</th>
                              <th className="text-right p-3 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {teamMembers.map((member) => (
                              <tr key={member.id} className="group hover:bg-muted/20 transition-colors">
                                <td className="p-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                        {member.email?.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium truncate max-w-[180px]">{member.email}</span>
                                  </div>
                                </td>
                                <td className="p-3 hidden lg:table-cell">
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px] block">
                                    {member.script_title || 'Unknown'}
                                  </span>
                                </td>
                                <td className="p-3 hidden md:table-cell">
                                  <div className="flex items-center gap-1.5">
                                    {member.role === 'editor' && <ShieldCheck size={14} className="text-primary" />}
                                    <span className="capitalize">{member.role}</span>
                                  </div>
                                </td>
                                <td className="p-3 hidden sm:table-cell">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    member.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  }`}>
                                    {member.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical size={14} />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleChangeRole(member, member.role === 'editor' ? 'viewer' : 'editor')}>
                                        <ShieldCheck size={14} className="mr-2" />
                                        Make {member.role === 'editor' ? 'Viewer' : 'Editor'}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => handleRemoveMember(member)}
                                      >
                                        {member.status === 'pending' ? (
                                          <><UserMinus size={14} className="mr-2" /> Revoke Invitation</>
                                        ) : (
                                          <><Trash2 size={14} className="mr-2" /> Remove from Team</>
                                        )}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ==================== BILLING ==================== */}
              <TabsContent value="billing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>You are currently on the Pro Annual plan.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary text-primary-foreground rounded-full">
                          <Zap size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Pro Plan</p>
                          <p className="text-sm text-muted-foreground">Next billing date: Oct 12, 2024</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">$120</p>
                        <p className="text-xs text-muted-foreground">per year</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4 flex justify-between">
                    <Button variant="outline" size="sm">Cancel Subscription</Button>
                    <Button size="sm">Upgrade Plan</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* ==================== SECURITY ==================== */}
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your password and security preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current">Current Password</Label>
                      <Input id="current" type="password" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new">New Password</Label>
                      <Input id="new" type="password" />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button onClick={() => showSuccess("Password updated")}>Update Password</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* ==================== AI ==================== */}
                            <TabsContent value="ai" className="space-y-6">
                {/* Admin Model Switching - Only for Charles */}
                {isAdminUser && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">🛠️ Admin: AI Model</CardTitle>
                      <CardDescription>Switch the AI model for all users and Telegram bot.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Current Model</p>
                          <p className="text-sm font-bold">{globalModel === 'k2think' ? 'K2-Think (Primary)' : globalModel === 'nvidia' ? 'NVIDIA Kimi-K2.5' : 'NVIDIA Qwen-3.5'}</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Active" />
                      </div>
                      <Select value={globalModel} onValueChange={handleModelChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="k2think">K2-Think (Primary)</SelectItem>
                          <SelectItem value="nvidia">NVIDIA Kimi-K2.5</SelectItem>
                          <SelectItem value="nvidia-fallback">NVIDIA Qwen-3.5</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        💡 Changes take effect immediately in Telegram bot and all AI features.
                      </p>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg">
                        <BrainCircuit size={20} />
                      </div>
                      <div>
                        <CardTitle>AI Integration</CardTitle>
                        <CardDescription>ScriptFlow AI powers all your writing tools.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="text-green-500" size={16} />
                        <p className="text-sm font-semibold">Using ScriptFlow AI (Built-in)</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        No configuration needed. All AI features are ready to use.
                      </p>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                      <p className="text-sm font-semibold">AI features included:</p>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Autocomplete — press Ctrl+J while writing</li>
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Scene Generator — generate full scenes from a premise</li>
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Dialogue Feedback — real AI analysis on every line</li>
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Character Chat — workshop dialogue in-character</li>
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Production Overseer — full script analysis and pacing</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
