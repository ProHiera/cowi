"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { MODEL_CONFIGS_UPDATED_EVENT } from "@/lib/ai/events";
import type { AIProvider, AIUsageMode, UserModelConfig } from "@/lib/types";

interface ModelConfigFormState {
  label: string;
  provider: AIProvider;
  model_name: string;
  mode: AIUsageMode;
  base_url: string;
  secret_reference: string;
  api_key_last_four: string;
  metadata: string;
  is_default: boolean;
}

const PROVIDER_OPTIONS: { value: AIProvider; label: string }[] = [
  { value: "cowi_free", label: "Cowi Free" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "azure_openai", label: "Azure OpenAI" },
  { value: "google", label: "Google" },
  { value: "custom", label: "Custom JSON" },
];

const MODE_OPTIONS: { value: AIUsageMode; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "prompt_builder", label: "Prompt builder" },
  { value: "code_generation", label: "Code generation" },
  { value: "analysis", label: "Analysis" },
];

const EMPTY_FORM: ModelConfigFormState = {
  label: "",
  provider: "cowi_free",
  model_name: "cowi-free-chat",
  mode: "prompt_builder",
  base_url: "",
  secret_reference: "",
  api_key_last_four: "",
  metadata: "",
  is_default: false,
};

async function fetchJSON<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return (await response.json()) as T;
}

export function ModelConfigManager() {
  const [configs, setConfigs] = useState<UserModelConfig[]>([]);
  const [form, setForm] = useState<ModelConfigFormState>(() => ({ ...EMPTY_FORM }));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const hasConfigs = useMemo(() => configs.length > 0, [configs]);

  useEffect(() => {
    void loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJSON<UserModelConfig[]>("/api/model-configs");
      setConfigs(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load model configs");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setError(null);
    setStatus(null);
  }

  function handleEdit(config: UserModelConfig) {
    setEditingId(config.id);
    setForm({
      label: config.label,
      provider: config.provider,
      model_name: config.model_name,
      mode: config.mode,
      base_url: config.base_url ?? "",
      secret_reference: config.secret_reference ?? "",
      api_key_last_four: config.api_key_last_four ?? "",
      metadata: config.metadata ? JSON.stringify(config.metadata, null, 2) : "",
      is_default: config.is_default,
    });
    setStatus(null);
  }

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm("Delete this model config?");
    if (!confirmDelete) return;

    setPending(true);
    setError(null);
    try {
      await fetchJSON(`/api/model-configs/${id}`, { method: "DELETE" });
      await loadConfigs();
      window.dispatchEvent(new Event(MODEL_CONFIGS_UPDATED_EVENT));
      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete model config");
    } finally {
      setPending(false);
    }
  }

  async function handleSetDefault(config: UserModelConfig) {
    setPending(true);
    setError(null);
    try {
      await fetchJSON(`/api/model-configs/${config.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });
      await loadConfigs();
      window.dispatchEvent(new Event(MODEL_CONFIGS_UPDATED_EVENT));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to set default");
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setStatus(null);
    const wasEditing = Boolean(editingId);

    try {
      const payload: Record<string, unknown> = {
        label: form.label,
        provider: form.provider,
        model_name: form.model_name,
        mode: form.mode,
        base_url: form.base_url,
        secret_reference: form.secret_reference,
        api_key_last_four: form.api_key_last_four,
        metadata: form.metadata,
        is_default: form.is_default,
      };

      const url = editingId ? `/api/model-configs/${editingId}` : "/api/model-configs";
      const method = editingId ? "PATCH" : "POST";

      await fetchJSON(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await loadConfigs();
      resetForm();
      setStatus(wasEditing ? "Model config updated" : "Model config saved");
      window.dispatchEvent(new Event(MODEL_CONFIGS_UPDATED_EVENT));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save model config");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model configs</CardTitle>
        <CardDescription>
          Provide reusable provider + model settings. Reference env vars via <code>secret_reference</code>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </div>
          ) : hasConfigs ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Provider · Mode</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="space-y-1">
                      <p className="font-semibold">{config.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {config.base_url ?? "Default base URL"}
                      </p>
                    </TableCell>
                    <TableCell className="space-y-1">
                      <p>{config.provider}</p>
                      <Badge variant="outline" className="capitalize">
                        {config.mode.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-y-1">
                      <p>{config.model_name}</p>
                      {config.is_default && <Badge variant="secondary">Default</Badge>}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={config.is_default || pending}
                        onClick={() => handleSetDefault(config)}
                      >
                        Set default
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleDelete(config.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No model configs yet. Use the form below to add one.</p>
          )}
        </div>

        <Separator />

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="model-label">Label</Label>
              <Input
                id="model-label"
                value={form.label}
                onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                placeholder="Prod-ready GPT-4o"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-name">Model name</Label>
              <Input
                id="model-name"
                value={form.model_name}
                onChange={(event) => setForm((prev) => ({ ...prev, model_name: event.target.value }))}
                placeholder="gpt-4o-mini"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={form.provider}
                onValueChange={(next: AIProvider) => setForm((prev) => ({ ...prev, provider: next }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Usage mode</Label>
              <Select
                value={form.mode}
                onValueChange={(next: AIUsageMode) => setForm((prev) => ({ ...prev, mode: next }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="base-url">Base URL (optional)</Label>
              <Input
                id="base-url"
                value={form.base_url}
                onChange={(event) => setForm((prev) => ({ ...prev, base_url: event.target.value }))}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-reference">Secret reference (env var)</Label>
              <Input
                id="secret-reference"
                value={form.secret_reference}
                onChange={(event) => setForm((prev) => ({ ...prev, secret_reference: event.target.value }))}
                placeholder="OPENAI_API_KEY"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="api-key-last-four">API key last four (display only)</Label>
              <Input
                id="api-key-last-four"
                value={form.api_key_last_four}
                onChange={(event) => setForm((prev) => ({ ...prev, api_key_last_four: event.target.value }))}
                placeholder="abcd"
                maxLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Default selection</Label>
              <Select
                value={form.is_default ? "true" : "false"}
                onValueChange={(value) => setForm((prev) => ({ ...prev, is_default: value === "true" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Only when referenced</SelectItem>
                  <SelectItem value="true">Always default</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="metadata">Metadata JSON (optional)</Label>
            <Textarea
              id="metadata"
              value={form.metadata}
              onChange={(event) => setForm((prev) => ({ ...prev, metadata: event.target.value }))}
              placeholder='{"region":"us-east-1"}'
              rows={4}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : editingId ? "Update config" : "Save config"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm} disabled={pending}>
                Cancel
              </Button>
            )}
            {status && <p className="text-sm text-muted-foreground">{status}</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
