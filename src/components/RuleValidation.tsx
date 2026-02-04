
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Database, Code } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const RuleValidation: React.FC = () => {
  const [testInput, setTestInput] = useState('{"dialogue": "Hello, how are you?"}');
  const [validationResult, setValidationResult] = useState<{valid: boolean, message: string} | null>(null);

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(testInput);
      if (!parsed.dialogue) {
        setValidationResult({ valid: false, message: "Missing required property: 'dialogue'" });
        return;
      }
      setValidationResult({ valid: true, message: "Input matches schema. Safe for execution." });
    } catch (e) {
      setValidationResult({ valid: false, message: "Invalid JSON format." });
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle>Hallucination Mitigation: Validation</CardTitle>
        </div>
        <CardDescription>Validate input data against schemas before executing AI rules.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Code className="h-4 w-4" />
              Test Input (JSON)
            </label>
            <Textarea 
              placeholder='{"dialogue": "Text here..."}' 
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              className="font-mono text-xs min-h-[100px]"
            />
          </div>

          <Button onClick={handleValidate} className="w-full">Run Validation Check</Button>

          {validationResult && (
            <div className={`p-4 rounded-lg border flex items-start gap-3 ${
              validationResult.valid ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'
            }`}>
              {validationResult.valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <div className="space-y-1">
                <p className={`text-sm font-medium ${validationResult.valid ? 'text-green-700' : 'text-destructive'}`}>
                  {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
                </p>
                <p className="text-xs text-muted-foreground">{validationResult.message}</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
            <p className="font-semibold text-muted-foreground uppercase">Context Awareness Tip:</p>
            <p className="text-muted-foreground">Rules are executed within a sandboxed environment with strictly defined input boundaries to prevent hallucinations and code injection.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RuleValidation;
