"use client";

import React from 'react';
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, User, Shield, Bell, Zap, Download, CreditCard as CardIcon } from 'lucide-react';

const Profile = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            <header>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground mt-1">Manage your account settings and set e-mail preferences.</p>
            </header>

            <Tabs defaultValue="account" className="space-y-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="account" className="gap-2">
                  <User size={16} />
                  Account
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard size={16} />
                  Billing
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield size={16} />
                  Security
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell size={16} />
                  Notifications
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
                      <div className="space-y-2">
                        <Label htmlFor="role">Industry Role</Label>
                        <Input id="role" defaultValue="Screenwriter / Director" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input id="location" defaultValue="Los Angeles, CA" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <textarea 
                        id="bio" 
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                  </CardFooter>
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

                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold">Payment Method</h4>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-muted rounded">
                              <CardIcon size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Visa ending in 4242</p>
                              <p className="text-xs text-muted-foreground">Expiry 12/26</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 flex justify-between">
                      <Button variant="outline" size="sm">Cancel Subscription</Button>
                      <Button size="sm">Upgrade Plan</Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Usage Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Scripts</span>
                          <span className="font-medium">12 / 20</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: '60%' }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Storage</span>
                          <span className="font-medium">256MB / 2GB</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600" style={{ width: '15%' }} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Billing History</CardTitle>
                    <CardDescription>View and download your previous invoices.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">Amount</th>
                            <th className="text-left p-3 font-medium">Status</th>
                            <th className="text-right p-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {[
                            { date: 'Sep 12, 2023', amount: '$120.00', status: 'Paid' },
                            { date: 'Sep 12, 2022', amount: '$120.00', status: 'Paid' },
                            { date: 'Sep 12, 2021', amount: '$120.00', status: 'Paid' },
                          ].map((invoice, i) => (
                            <tr key={i}>
                              <td className="p-3">{invoice.date}</td>
                              <td className="p-3">{invoice.amount}</td>
                              <td className="p-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Download size={14} />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Manage your password and security preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current">Current Password</Label>
                        <Input id="current" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new">New Password</Label>
                        <Input id="new" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirm">Confirm New Password</Label>
                        <Input id="confirm" type="password" />
                      </div>
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