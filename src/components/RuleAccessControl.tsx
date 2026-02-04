
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ShieldAlert, ShieldCheck, UserPlus } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Permission {
  id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

const RuleAccessControl: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_rule_permissions')
      .select('*');

    if (error) {
      toast.error("Failed to fetch permissions");
    } else {
      setPermissions(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleAddPermission = async () => {
    if (!newUserEmail) return;
    
    // In a real app, you'd look up the user ID by email via an edge function or similar.
    // Here we'll simulate it for the demo purpose or just use the current user if testing.
    toast.info("In a production SaaS, this would look up the user and assign the role.");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case 'editor': return <ShieldCheck className="h-4 w-4 text-primary" />;
      default: return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>Security Hardening: RBAC</CardTitle>
        </div>
        <CardDescription>Manage user roles and permissions for AI rule management.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              placeholder="User Email" 
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddPermission} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Active Permissions</h4>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading permissions...</p>
            ) : permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No specialized permissions assigned.</p>
            ) : (
              permissions.map((perm) => (
                <div key={perm.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(perm.role)}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">User ID: {perm.user_id.slice(0, 8)}...</span>
                      <span className="text-xs text-muted-foreground capitalize">{perm.role}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive">Remove</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RuleAccessControl;
