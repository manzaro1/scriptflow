
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, RotateCcw, User } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RuleVersion {
  id: string;
  rule_id: string;
  content: string;
  version_number: number;
  created_at: string;
  created_by: string;
}

interface RuleVersioningProps {
  ruleId: string;
  onRevert: (content: string) => void;
}

const RuleVersioning: React.FC<RuleVersioningProps> = ({ ruleId, onRevert }) => {
  const [history, setHistory] = useState<RuleVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_rule_versions')
        .select('*')
        .eq('rule_id', ruleId)
        .order('version_number', { ascending: false });

      if (error) {
        toast.error("Failed to fetch version history");
      } else {
        setHistory(data || []);
      }
      setLoading(false);
    };

    if (ruleId) {
      fetchHistory();
    }
  }, [ruleId]);

  const handleRevert = async (version: RuleVersion) => {
    try {
      const { error } = await supabase
        .from('ai_rules')
        .update({ content: version.content, updated_at: new Date().toISOString() })
        .eq('id', ruleId);

      if (error) throw error;
      
      onRevert(version.content);
      toast.success(`Reverted to version ${version.version_number}`);
    } catch (error) {
      toast.error("Failed to revert version");
    }
  };

  if (loading) return <div className="text-center p-4">Loading history...</div>;

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle>Rule Version History</CardTitle>
        </div>
        <CardDescription>Track changes and revert to previous rule states.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No version history found.</p>
          ) : (
            history.map((version) => (
              <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Version {version.version_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(version.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>Modified by: {version.created_by.slice(0, 8)}...</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => handleRevert(version)}
                >
                  <RotateCcw className="h-4 w-4" />
                  Revert
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RuleVersioning;
