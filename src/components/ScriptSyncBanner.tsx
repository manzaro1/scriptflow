"use client";

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, X, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { showSuccess, showError } from "@/utils/toast";

interface ScriptSyncBannerProps {
  scripts: any[];
  onSyncComplete?: () => void;
}

const ScriptSyncBanner = ({ scripts, onSyncComplete }: ScriptSyncBannerProps) => {
  const [show, setShow] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncedScripts, setSyncedScripts] = useState<Set<string>>(new Set());
  const [needsSync, setNeedsSync] = useState<string[]>([]);

  useEffect(() => {
    // Check which scripts need character sync
    const checkScripts = async () => {
      if (!scripts || scripts.length === 0) return;
      
      const needsSyncList: string[] = [];
      
      for (const script of scripts) {
        // Check if script has character data
        const hasCharacters = await checkScriptHasCharacters(script.id);
        if (!hasCharacters) {
          needsSyncList.push(script.id);
        }
      }
      
      if (needsSyncList.length > 0) {
        setNeedsSync(needsSyncList);
        setShow(true);
      }
    };
    
    checkScripts();
  }, [scripts]);

  const checkScriptHasCharacters = async (scriptId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/scripts/${scriptId}/characters`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('scriptflow_token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return data.characters && data.characters.length > 0;
      }
      return false;
    } catch {
      return false;
    }
  };

  const syncAllScripts = async () => {
    setSyncing(true);
    
    for (const scriptId of needsSync) {
      try {
        const res = await fetch(`/api/scripts/${scriptId}/characters/sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('scriptflow_token')}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (res.ok) {
          setSyncedScripts(prev => new Set([...prev, scriptId]));
        }
      } catch (err) {
        console.error(`Failed to sync script ${scriptId}:`, err);
      }
    }
    
    setSyncing(false);
    showSuccess(`Synced ${syncedScripts.size} scripts with character data!`);
    
    if (onSyncComplete) {
      onSyncComplete();
    }
    
    // Hide banner after sync
    setTimeout(() => setShow(false), 2000);
  };

  if (!show || needsSync.length === 0) return null;

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Character Data Update Available
      </AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        <p className="mb-3">
          {needsSync.length} of your scripts need to sync character data for the enhanced AI features 
          (character awareness, scene tracking, dialogue memory). This enables characters to know 
          their scenes, dialogues, and interactions.
        </p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={syncAllScripts}
            disabled={syncing}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {syncing ? (
              <>
                <RefreshCw size={14} className="animate-spin mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw size={14} className="mr-2" />
                Sync All Scripts
              </>
            )}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShow(false)}
            className="text-amber-700 hover:text-amber-800"
          >
            <X size={14} className="mr-2" />
            Dismiss
          </Button>
        </div>
        {syncedScripts.size > 0 && (
          <p className="mt-2 text-xs flex items-center gap-1">
            <Check size={12} className="text-green-600" />
            {syncedScripts.size} scripts synced successfully
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ScriptSyncBanner;