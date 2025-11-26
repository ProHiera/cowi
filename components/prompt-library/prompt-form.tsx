"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ComboType } from "@/lib/types";

export interface PromptFormValues {
  title: string;
  summary: string;
  content: string;
  comboType: ComboType | "all";
  tags: string[];
  isShared: boolean;
}

interface PromptFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  initialValues?: PromptFormValues;
  onSubmit: (values: PromptFormValues) => Promise<void> | void;
}

const COMBO_OPTIONS: Array<{ label: string; value: ComboType | "all" }> = [
  { label: "All combos", value: "all" },
  { label: "Enterprise", value: "enterprise" },
  { label: "Web", value: "web" },
  { label: "App", value: "app" },
  { label: "Custom", value: "custom" },
];

export function PromptForm({ open, onOpenChange, loading, initialValues, onSubmit }: PromptFormProps) {
  const defaults = useMemo<PromptFormValues>(() => {
    if (initialValues) {
      return initialValues;
    }
    return { title: "", summary: "", content: "", comboType: "all", tags: [], isShared: false };
  }, [initialValues]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const tagsRaw = (formData.get("tags") as string) ?? "";
    const payload: PromptFormValues = {
      title: ((formData.get("title") as string) ?? "").trim(),
      summary: ((formData.get("summary") as string) ?? "").trim(),
      content: ((formData.get("content") as string) ?? "").trim(),
      comboType: (formData.get("comboType") as ComboType | "all") ?? "all",
      tags: tagsRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      isShared: formData.get("isShared") === "on",
    };

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={`${initialValues?.title ?? "new"}-${open ? "open" : "closed"}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{initialValues ? "Edit prompt" : "Create prompt"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="prompt-title">Title</Label>
            <Input
              id="prompt-title"
              name="title"
              defaultValue={defaults.title}
              placeholder="e.g. SaaS onboarding script"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt-summary">Summary</Label>
            <Input
              id="prompt-summary"
              name="summary"
              defaultValue={defaults.summary ?? ""}
              placeholder="Short description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt-content">Prompt content</Label>
            <Textarea
              id="prompt-content"
              name="content"
              defaultValue={defaults.content}
              rows={6}
              placeholder="Include system/user instructions"
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prompt-combo">Combo focus</Label>
              <select
                id="prompt-combo"
                name="comboType"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                defaultValue={defaults.comboType}
              >
                {COMBO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt-tags">Tags (comma separated)</Label>
              <Input
                id="prompt-tags"
                name="tags"
                defaultValue={defaults.tags.join(", ")}
                placeholder="ai, onboarding, marketing"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="prompt-shared"
              type="checkbox"
              className="size-4"
              name="isShared"
              defaultChecked={defaults.isShared}
            />
            <Label htmlFor="prompt-shared" className="font-normal">
              Share with team (read-only for others)
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialValues ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
