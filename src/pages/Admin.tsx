import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Database, 
  Trash2, 
  Search,
  Loader2,
  LayoutDashboard,
  Terminal
} from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface User {
  id: string;
  email: string;
  created_at: string;
  is_admin: number;
}

interface Script {
  id: string;
  title: string;
  author: string;
  user_id: string;
  owner_email: string;
  genre: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  users: { count: number };
  scripts: { count: number };
  collaborations: { count: number };
}

export default function Admin() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if admin
  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, scriptsRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/scripts'),
        api.get('/admin/stats'),
      ]);
      
      if (usersRes.ok) setUsers(await usersRes.json());
      if (scriptsRes.ok) setScripts(await scriptsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      showError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    try {
      const res = await api.post('/admin/query', { sql: query, params: [] });
      const data = await res.json();
      if (data.results) {
        setQueryResults(data.results);
        showSuccess('Query executed');
      } else {
        showError(data.error || 'Query failed');
      }
    } catch (err) {
      showError('Query execution failed');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user and all their data?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      showSuccess('User deleted');
      fetchData();
    } catch {
      showError('Failed to delete user');
    }
  };

  const deleteScript = async (id: string) => {
    if (!confirm('Delete this script?')) return;
    try {
      await api.delete(`/admin/scripts/${id}`);
      showSuccess('Script deleted');
      fetchData();
    } catch {
      showError('Failed to delete script');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredScripts = scripts.filter(s => 
    (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.owner_email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage ScriptFlow users, scripts, and database</p>
          </div>
          <Button onClick={fetchData} variant="outline">Refresh</Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="scripts">
              <FileText className="w-4 h-4 mr-2" />
              Scripts ({scripts.length})
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="w-4 h-4 mr-2" />
              Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.users.count || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Scripts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.scripts.count || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Collaborations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.collaborations.count || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={() => setActiveTab('users')} className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" /> Manage Users
                </Button>
                <Button onClick={() => setActiveTab('database')} variant="outline" className="w-full justify-start">
                  <Terminal className="w-4 h-4 mr-2" /> Run SQL Query
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Created</th>
                    <th className="text-left p-3 font-medium">Admin</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3 font-mono text-xs">{u.id}</td>
                      <td className="p-3">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="p-3">{u.is_admin ? '✓' : ''}</td>
                      <td className="p-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteUser(u.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="scripts" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search scripts..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-medium">Title</th>
                    <th className="text-left p-3 font-medium">Owner</th>
                    <th className="text-left p-3 font-medium">Genre</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredScripts.map((s) => (
                    <tr key={s.id}>
                      <td className="p-3">{s.title || 'Untitled'}</td>
                      <td className="p-3 text-xs">{s.owner_email || s.user_id}</td>
                      <td className="p-3">{s.genre || '-'}</td>
                      <td className="p-3">{s.status || 'Draft'}</td>
                      <td className="p-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteScript(s.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SQL Query</CardTitle>
                <CardDescription>Run SELECT queries on the database (admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SELECT * FROM users"
                  className="font-mono min-h-[100px]"
                />
                <Button onClick={executeQuery} className="w-full">
                  <Terminal className="w-4 h-4 mr-2" />
                  Execute Query
                </Button>

                {queryResults.length > 0 && (
                  <div className="border rounded-lg overflow-hidden mt-4">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          {Object.keys(queryResults[0]).map((key) => (
                            <th key={key} className="text-left p-2 font-medium">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {queryResults.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="p-2 font-mono text-xs truncate max-w-[200px]">
                                {typeof val === 'string' ? val.slice(0, 100) : JSON.stringify(val).slice(0, 100)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>users</strong> - User accounts and authentication</p>
                  <p><strong>scripts</strong> - Screenplays and their content</p>
                  <p><strong>script_collaborators</strong> - Sharing permissions</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}