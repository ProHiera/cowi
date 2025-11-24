"use client";

import { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  tags?: string[];
  onRecommend?: () => void;
  isBroadcasting?: boolean;
}

export function PromptEditor({ value, onChange, tags = [], onRecommend, isBroadcasting }: PromptEditorProps) {
  const [localPrompt, setLocalPrompt] = useState(value);

  function handleUpdate(next: string) {
    setLocalPrompt(next);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="ai-prompt" className="text-sm font-medium">
          AI Prompt
        </Label>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isBroadcasting && (
            <Badge variant="destructive" className="animate-pulse">
              Live edit
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={onRecommend} disabled={!onRecommend}>
            Recommend prompts
          </Button>
        </div>
      </div>
      <Textarea
        id="ai-prompt"
        value={localPrompt}
        onChange={(event) => handleUpdate(event.target.value)}
        placeholder="Describe the product, target persona, and deployment strategy..."
        className="min-h-[220px]"
      />
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
