// Local API client to replace Supabase
const API_URL = import.meta.env.VITE_API_URL || 'https://scriptflow-api-zaro.zocomputer.io';

export interface User {
  id: string;
  email: string;
}

export interface Script {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  content: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface Collaborator {
  id: number;
  script_id: string;
  email: string;
  role: 'editor' | 'viewer';
  status: 'active' | 'pending';
  created_at: string;
  script_title?: string;
}

class APIClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('scriptflow_token', token);
    } else {
      localStorage.removeItem('scriptflow_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('scriptflow_token');
    }
    return this.token;
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_URL}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      window.location.href = '/login';
    }

    return response;
  }

  // Auth
  async signUp(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await this.fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    this.setToken(data.token);
    return data;
  }

  async signIn(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await this.fetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    this.setToken(data.token);
    return data;
  }

  async signInWithGoogle(credential: string): Promise<{ user: User; token: string }> {
    const res = await this.fetch('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    this.setToken(data.token);
    return data;
  }

  // AI proxy
  async aiChat(body: { messages: any[]; max_tokens?: number; temperature?: number; model?: string }): Promise<any> {
    const res = await this.fetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'AI request failed' }));
      throw new Error(err.error || 'AI request failed');
    }
    return res.json();
  }

  async signOut(): Promise<void> {
    this.setToken(null);
  }

  async getUser(): Promise<User> {
    const res = await this.fetch('/api/auth/user');
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  }

  // Scripts
  async getScripts(): Promise<Script[]> {
    const res = await this.fetch('/api/scripts');
    if (!res.ok) throw new Error('Failed to fetch scripts');
    return res.json();
  }

  async getScript(id: string): Promise<Script> {
    const res = await this.fetch(`/api/scripts/${id}`);
    if (!res.ok) throw new Error('Script not found');
    return res.json();
  }

  async createScript(script: { title: string; author?: string; content?: any[] }): Promise<Script> {
    const res = await this.fetch('/api/scripts', {
      method: 'POST',
      body: JSON.stringify(script),
    });
    if (!res.ok) throw new Error('Failed to create script');
    return res.json();
  }

  async updateScript(id: string, updates: { title?: string; author?: string; content?: any[] }): Promise<void> {
    const res = await this.fetch(`/api/scripts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update script');
  }

  async deleteScript(id: string): Promise<void> {
    const res = await this.fetch(`/api/scripts/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete script');
  }

  // Collaborators
  async addCollaborator(scriptId: string, email: string, role: 'editor' | 'viewer'): Promise<void> {
    const res = await this.fetch(`/api/scripts/${scriptId}/collaborators`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to add collaborator' }));
      throw new Error(err.error || 'Failed to add collaborator');
    }
  }

  async getScriptCollaborators(scriptId: string): Promise<any[]> {
    const res = await this.fetch(`/api/scripts/${scriptId}/collaborators`);
    if (!res.ok) throw new Error('Failed to fetch collaborators');
    return res.json();
  }

  async updateCollaboratorRole(scriptId: string, collabId: string, role: string): Promise<void> {
    const res = await this.fetch(`/api/scripts/${scriptId}/collaborators/${collabId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
  }

  async removeCollaborator(scriptId: string, collabId: string): Promise<void> {
    const res = await this.fetch(`/api/scripts/${scriptId}/collaborators/${collabId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove collaborator');
  }

  // All collaborators across user's scripts (for Teams tab)
  async getAllCollaborators(): Promise<any[]> {
    const res = await this.fetch('/api/collaborators');
    if (!res.ok) throw new Error('Failed to fetch collaborators');
    return res.json();
  }

  async getCollaboratorCount(): Promise<number> {
    const res = await this.fetch('/api/collaborators/count');
    if (!res.ok) return 0;
    const data = await res.json();
    return data.count || 0;
  }
}

export const api = new APIClient();
