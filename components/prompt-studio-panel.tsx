"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

import { PromptEditor } from "@/components/prompt-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { PromptTemplate } from "@/lib/types";

interface PromptStudioPanelProps {
  projectId: string;
  initialPrompt: string;
  templates: PromptTemplate[];
  combo?: string;
}

export function PromptStudioPanel({ projectId, initialPrompt, templates, combo }: PromptStudioPanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [pending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const searchParams = useSearchParams();

  const filteredTemplates = useMemo(() => {
    if (!combo) return templates;
    return templates.filter((template) => template.tags?.includes(combo) || template.combo_type === combo);
  }, [combo, templates]);

  async function savePrompt() {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt_text: prompt, status: "prompt_ready" }),
    });

    if (!response.ok) {
      console.error("Failed to update prompt", await response.text());
    }
  }

  function handleRecommend(template: PromptTemplate) {
    setPrompt(template.content);
    setSelectedTemplate(template);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <CardTitle>Prompt studio</CardTitle>
        <p className="text-sm text-muted-foreground">
          Combo: {combo ?? searchParams.get("combo") ?? "n/a"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <PromptEditor
          value={prompt}
          onChange={setPrompt}
          tags={selectedTemplate?.tags}
          isBroadcasting={pending}
          onRecommend={() => setLibraryOpen(true)}
        />
        <div className="flex flex-wrap gap-2">
          <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Prompt templates</DialogTitle>
                <DialogDescription>
                  Filtered by combo tag when available. Selecting a template will push it into the editor.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    className="rounded-lg border p-4 text-left hover:border-foreground"
                    onClick={() => {
                      handleRecommend(template);
                      setLibraryOpen(false);
                    }}
                  >
                    <p className="text-sm font-semibold">{template.title}</p>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {template.tags?.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={() => setLibraryOpen(true)}>
            Browse template library
          </Button>
          <Button onClick={() => startTransition(savePrompt)} disabled={pending}>
            {pending ? "Saving..." : "Save prompt"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
