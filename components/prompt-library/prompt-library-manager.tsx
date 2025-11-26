"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type {
  ComboType,
  PromptLibraryEntry,
  PromptRecommendation,
  PromptUsageLog,
} from "@/lib/types";

import { PromptForm, type PromptFormValues } from "@/components/prompt-library/prompt-form";
import { RecommendationsRail } from "@/components/prompt-library/recommendations-rail";
import { UsageList } from "@/components/prompt-library/usage-list";
import { UsageInsights } from "@/components/prompt-library/usage-insights";

interface PromptLibraryManagerProps {
  initialPrompts: PromptLibraryEntry[];
  recommendations: PromptRecommendation[];
  usageLogs: PromptUsageLog[];
  comboType?: ComboType;
}

export function PromptLibraryManager({
  initialPrompts,
  recommendations,
  usageLogs,
  comboType,
}: PromptLibraryManagerProps) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [logs, setLogs] = useState(usageLogs);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptLibraryEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [defaultProjectId, setDefaultProjectId] = useState("");
  const [deployAfterApply, setDeployAfterApply] = useState(true);

  const sortedPrompts = useMemo(
    () => [...prompts].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [prompts]
  );

  const closeForm = () => {
    setFormOpen(false);
    setEditingPrompt(null);
  };

  const buildFormValues = useCallback((entry?: PromptLibraryEntry): PromptFormValues => {
    if (!entry) {
      return { title: "", summary: "", content: "", comboType: "all", tags: [], isShared: false };
    }
    return {
      title: entry.title,
      summary: entry.summary ?? "",
      content: entry.content,
      comboType: entry.combo_type,
      tags: entry.tags ?? [],
      isShared: entry.is_shared,
    };
  }, []);

  const upsertPrompt = async (values: PromptFormValues, targetId?: string | null) => {
    setIsSaving(true);
    try {
      const payload = {
        title: values.title,
        summary: values.summary,
        content: values.content,
        comboType: values.comboType,
        tags: values.tags,
        isShared: values.isShared,
      };

      const endpoint = targetId ? `/api/prompts/entries/${targetId}` : "/api/prompts/entries";
      const response = await fetch(endpoint, {
        method: targetId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to save prompt");
      }

      const entry = (await response.json()) as PromptLibraryEntry;
      setPrompts((prev) => {
        const filtered = prev.filter((item) => item.id !== entry.id);
        return [entry, ...filtered];
      });
      toast.success(targetId ? "Prompt updated" : "Prompt saved");
      closeForm();
      return entry;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save prompt");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (promptId: string) => {
    setBusyId(promptId);
    try {
      const response = await fetch(`/api/prompts/entries/${promptId}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to delete prompt");
      }

      setPrompts((prev) => prev.filter((item) => item.id !== promptId));
      toast.success("Prompt deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete prompt");
    } finally {
      setBusyId(null);
    }
  };

  const refreshUsageLogs = async () => {
    const response = await fetch("/api/prompts/usage?limit=20");
    if (!response.ok) return;
    const data = (await response.json()) as PromptUsageLog[];
    setLogs(data);
  };

  const handleApply = async (
    promptId: string,
    promptContent?: string,
    options?: { deploy?: boolean }
  ) => {
    setBusyId(promptId);
    try {
      const shouldDeploy = Boolean(options?.deploy && defaultProjectId);
      const response = await fetch("/api/prompts/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId,
          projectId: defaultProjectId || undefined,
          comboType,
          deploy: shouldDeploy,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to apply prompt");
      }

      if (defaultProjectId) {
        toast.success(
          shouldDeploy ? "Prompt applied & deploy triggered" : "Prompt applied to project"
        );
      } else {
        toast.success("Prompt ready in Studio (open via link)");
      }
      await refreshUsageLogs();
      if (!defaultProjectId && typeof navigator !== "undefined" && promptContent) {
        await navigator.clipboard.writeText(promptContent);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to apply prompt");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveRecommendation = async (recommendation: PromptRecommendation) => {
    setEditingPrompt(null);
    return upsertPrompt({
      title: recommendation.title,
      summary: recommendation.summary ?? "",
      content: recommendation.content,
      comboType: recommendation.combo_type,
      tags: recommendation.tags,
      isShared: false,
    });
  };

  const handleApplyRecommendation = async (recommendation: PromptRecommendation) => {
    let target = prompts.find((prompt) => prompt.id === recommendation.id);
    if (!target) {
      const created = await handleSaveRecommendation(recommendation);
      if (!created) return;
      target = created;
    }
    await handleApply(target.id, recommendation.content, { deploy: deployAfterApply });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-lg border bg-muted/20 p-4 text-sm">
        <p className="font-medium">Default project target</p>
        <p className="text-muted-foreground">
          Optional project ID to update when clicking &ldquo;Apply&rdquo;. Leave blank to copy prompt text to the clipboard.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Project UUID"
            value={defaultProjectId}
            onChange={(event) => setDefaultProjectId(event.target.value)}
          />
          <Button variant="outline" type="button" onClick={() => setDefaultProjectId("")}>
            Clear
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            id="deploy-after-apply"
            type="checkbox"
            className="size-4"
            checked={deployAfterApply && Boolean(defaultProjectId)}
            onChange={(event) => setDeployAfterApply(event.target.checked)}
            disabled={!defaultProjectId}
          />
          <Label htmlFor="deploy-after-apply" className="font-normal text-muted-foreground">
            Trigger Vercel deploy hook after apply
          </Label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">My prompt library</h2>
          <p className="text-sm text-muted-foreground">Save, edit, and share prompts for reuse across combos.</p>
        </div>
        <Button
          onClick={() => {
            setEditingPrompt(null);
            setFormOpen(true);
          }}
        >
          New prompt
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sortedPrompts.map((prompt) => (
          <Card key={prompt.id} className="flex flex-col">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{prompt.title}</CardTitle>
                <Badge variant="outline">{prompt.combo_type}</Badge>
                <Badge variant={prompt.is_shared ? "default" : "secondary"}>
                  {prompt.is_shared ? "shared" : "private"}
                </Badge>
              </div>
              <CardDescription>{prompt.summary ?? "No summary"}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="line-clamp-4">{prompt.content}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {prompt.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="capitalize">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs">
                  Updated {new Date(prompt.updated_at).toLocaleString()} · Used {prompt.usage_count} times
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApply(prompt.id, prompt.content, { deploy: deployAfterApply })}
                  disabled={busyId === prompt.id}
                >
                  {busyId === prompt.id ? "Applying..." : "Apply"}
                </Button>
                <Button size="sm" variant="secondary" asChild>
                  <Link href={`/studio?promptId=${prompt.id}`}>Open in Studio</Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingPrompt(prompt);
                    setFormOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(prompt.id)}
                  disabled={busyId === prompt.id}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {sortedPrompts.length === 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>No prompts yet</CardTitle>
              <CardDescription>Start by saving a template from recommendations or create one manually.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <Separator />

      <RecommendationsRail
        recommendations={recommendations}
        onSave={handleSaveRecommendation}
        onApply={handleApplyRecommendation}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <UsageList logs={logs} />
        <UsageInsights logs={logs} />
      </div>

      <PromptForm
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeForm();
          } else {
            setFormOpen(true);
          }
        }}
        loading={isSaving}
        initialValues={buildFormValues(editingPrompt ?? undefined)}
        onSubmit={async (values) => {
          await upsertPrompt(values, editingPrompt?.id);
        }}
      />
    </div>
  );
}
