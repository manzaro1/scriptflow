"use client";

import React, { useState } from 'react';
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
  Bell, 
  Zap, 
  Download, 
  CreditCard as CardIcon,
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Trash2,
  ShieldCheck
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
import { showSuccess } from "@/utils/toast";

const Profile = () => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Alex Rivers', email: 'alex@example.com', role: 'Owner', status: 'Active', avatar: 'AR' },
    { id: 2, name: 'John Director', email: 'john@production.com', role: 'Admin', status: 'Active', avatar: 'JD' },
    { id: 3, name: 'Sarah Editor', email: 'sarah@cuts.com', role: 'Editor', status: 'Active', avatar: 'SE' },
    { id: 4, name: 'Mike Intern', email: 'mike@intern.com', role: 'Viewer', status: 'Pending', avatar: 'MI' },
  ]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    showSuccess(`Invitation sent to ${inviteEmail}`);
    setInviteEmail('');
  };

  const handleRemoveMember = (id: number) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    showSuccess("Member removed from team");
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

            <Tabs defaultValue="account" className="space-y-6">
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
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>AR</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">Change Avatar</Button>
                        <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size of 800K</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue="Alex Rivers" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" defaultValue="alex@example.com" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
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
                        <Select defaultValue="editor">
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
                    <div className="rounded-md border">
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
                            <tr key={member.id} className="group">
                              <td className="p-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-[10px]">{member.avatar}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{member.name}</span>
                                    <span className="text-xs text-muted-foreground">{member.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 hidden md:table-cell">
                                <div className="flex items-center gap-1.5">
                                  {member.role === 'Owner' || member.role === 'Admin' ? (
                                    <ShieldCheck size={14} className="text-primary" />
                                  ) : null}
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
                                {member.role !== 'Owner' && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical size={14} />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>Change Role</DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveMember(member.id)}>
                                        <Trash2 size={14} className="mr-2" />
                                        Remove Member
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2">
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
                </div>
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
                    <Button>Update Password</Button>
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