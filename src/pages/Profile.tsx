"use client";

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  EyeOff
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
import { supabase } from "@/integrations/supabase/client";
import { sanitizeInput } from "@/utils/security";
import { saveGeminiKey, removeGeminiKey, testGeminiKey } from "@/utils/ai";
import { useSearchParams } from "react-router-dom";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'account';

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('editor');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // AI key state
  const [aiKeyInput, setAiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);

  useEffect(() => {
    const fetchKeyStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data } = await supabase
          .from('profiles')
          .select('gemini_api_key')
          .eq('id', user.id)
          .single();
        
        if (data?.gemini_api_key) {
          setHasKey(true);
          setAiKeyInput(data.gemini_api_key);
        }
      }
      setLoadingKey(false);
    };
    fetchKeyStatus();
  }, []);

  const handleSaveKey = async () => {
    const trimmed = aiKeyInput.trim();
    if (!trimmed) {
      showError("Please enter an API key");
      return;
    }
    const success = await saveGeminiKey(trimmed);
    if (success) {
      setHasKey(true);
      setTestResult(null);
      showSuccess("API key saved securely to your profile");
    } else {
      showError("Failed to save API key");
    }
  };

  const handleRemoveKey = async () => {
    const success = await removeGeminiKey();
    if (success) {
      setAiKeyInput('');
      setHasKey(false);
      setTestResult(null);
      showSuccess("API key removed from your profile");
    } else {
      showError("Failed to remove API key");
    }
  };

  const handleTestKey = async () => {
    const key = aiKeyInput.trim();
    if (!key) {
      showError("Enter a key first");
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    const ok = await testGeminiKey(key);
    setTestingKey(false);
    setTestResult(ok ? 'success' : 'error');
    if (ok) {
      showSuccess("API key is valid");
    } else {
      showError("API key is invalid or expired");
    }
  };

  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Alex Rivers', email: 'alex@example.com', role: 'Owner', status: 'Active', avatar: 'AR' },
    { id: 2, name: 'John Director', email: 'john@production.com', role: 'Admin', status: 'Active', avatar: 'JD' },
    { id: 3, name: 'Sarah Editor', email: 'sarah@cuts.com', role: 'Editor', status: 'Active', avatar: 'SE' },
    { id: 4, name: 'Mike Intern', email: 'mike@intern.com', role: 'Viewer', status: 'Pending', avatar: 'MI' },
  ]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    const newMember = {
      id: Date.now(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole.charAt(0).toUpperCase() + inviteRole.slice(1),
      status: 'Pending',
      avatar: inviteEmail.substring(0, 2).toUpperCase()
    };

    setTeamMembers(prev => [...prev, newMember]);
    showSuccess(`Team invitation sent to ${sanitizeInput(inviteEmail)}`);
    setInviteEmail('');
  };

  const handleRemoveMember = (id: number, name: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    showSuccess(`${name} has been removed from the team.`);
  };

  const handleRevokeInvite = (id: number, email: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    showSuccess(`Invitation for ${email} has been revoked.`);
  };

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

              <TabsContent value="account" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your photo and personal details here.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={currentUser?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} />
                        <AvatarFallback>{currentUser?.email?.substring(0,2).toUpperCase() || "AR"}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">Change Avatar</Button>
                        <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={currentUser?.user_metadata?.first_name || "Alex Rivers"} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" defaultValue={currentUser?.email || "alex@example.com"} readOnly className="bg-muted" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button onClick={() => showSuccess("Profile updated")}>Save Changes</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="teams" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Invite Collaborators</CardTitle>
                    <CardDescription>Invite your production team to collaborate on your scripts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="team-email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            id="team-email" 
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
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" className="w-full sm:w-auto gap-2">
                          <UserPlus size={16} />
                          Send Invite
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Team Members</CardTitle>
                    <CardDescription>Manage roles and permissions for your current team.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left p-3 font-medium">Member</th>
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
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{member.avatar}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{member.name}</span>
                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 hidden md:table-cell">
                                <div className="flex items-center gap-1.5">
                                  {(member.role === 'Owner' || member.role === 'Admin') && (
                                    <ShieldCheck size={14} className="text-primary" />
                                  )}
                                  <span>{member.role}</span>
                                </div>
                              </td>
                              <td className="p-3 hidden sm:table-cell">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {member.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                {member.role !== 'Owner' ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical size={14} />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      {member.status === 'Pending' ? (
                                        <>
                                          <DropdownMenuItem onClick={() => showSuccess("Invite resent!")}>
                                            Resend Invitation
                                          </DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive" 
                                            onClick={() => handleRevokeInvite(member.id, member.email)}
                                          >
                                            <UserMinus size={14} className="mr-2" />
                                            Revoke Invitation
                                          </DropdownMenuItem>
                                        </>
                                      ) : (
                                        <>
                                          <DropdownMenuItem>Change Permissions</DropdownMenuItem>
                                          <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive" 
                                            onClick={() => handleRemoveMember(member.id, member.name)}
                                          >
                                            <Trash2 size={14} className="mr-2" />
                                            Remove from Team
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground px-2 uppercase font-bold">Admin</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

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

              <TabsContent value="ai" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg">
                        <BrainCircuit size={20} />
                      </div>
                      <div>
                        <CardTitle>AI Integration</CardTitle>
                        <CardDescription>Connect your Google Gemini API key to enable AI-powered screenwriting features.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="gemini-key">Gemini API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="gemini-key"
                            className="pl-10 pr-10 font-mono text-sm"
                            type={showKey ? "text" : "password"}
                            placeholder="AIzaSy..."
                            value={aiKeyInput}
                            onChange={(e) => { setAiKeyInput(e.target.value); setTestResult(null); }}
                            disabled={loadingKey}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowKey(!showKey)}
                          >
                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <Button variant="outline" onClick={handleTestKey} disabled={testingKey || !aiKeyInput.trim() || loadingKey}>
                          {testingKey ? <Loader2 size={16} className="animate-spin" /> : "Test"}
                        </Button>
                      </div>
                      {testResult === 'success' && (
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> Key is valid and working
                        </p>
                      )}
                      {testResult === 'error' && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          <XCircle size={12} /> Key is invalid or expired
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Your key is stored securely in your profile and never exposed to other users. Get a free key from{' '}
                        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                          Google AI Studio
                        </a>.
                      </p>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                      <p className="text-sm font-semibold">AI features powered by your key:</p>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Autocomplete — press Ctrl+J while writing</li>
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Scene Generator — generate full scenes from a premise</li>
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Dialogue Feedback — real AI analysis on every line</li>
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Character Chat — workshop dialogue in-character</li>
                        <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Production Overseer — full script analysis and pacing</li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4 flex justify-between">
                    {hasKey && (
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemoveKey}>
                        Remove Key
                      </Button>
                    )}
                    <Button onClick={handleSaveKey} disabled={!aiKeyInput.trim() || loadingKey} className="ml-auto">
                      {hasKey ? 'Update Key' : 'Save Key'}
                    </Button>
                  </CardFooter>
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