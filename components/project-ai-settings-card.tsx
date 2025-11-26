"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MODEL_CONFIGS_UPDATED_EVENT } from "@/lib/ai/events";
import type { AIProvider, AIUsageMode, ProjectAISettings, UserModelConfig } from "@/lib/types";

const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "cowi_free", label: "Cowi Free (shared)" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "azure_openai", label: "Azure OpenAI" },
  { value: "google", label: "Google" },
  { value: "custom", label: "Custom" },
];

const MODES: { value: AIUsageMode; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "prompt_builder", label: "Prompt builder" },
  { value: "code_generation", label: "Code generation" },
  { value: "analysis", label: "Analysis" },
];

const SAFETY_LEVELS: { value: ProjectAISettings["safety_level"]; label: string }[] = [
  { value: "strict", label: "Strict" },
  { value: "balanced", label: "Balanced" },
  { value: "creative", label: "Creative" },
];

const DEFAULT_STATE = {
  preferred_mode: "prompt_builder" as AIUsageMode,
  model_config_id: "",
  fallback_provider: "cowi_free" as AIProvider,
  temperature: "0.2",
  max_output_tokens: "800",
  system_prompt: "",
  safety_level: "balanced" as ProjectAISettings["safety_level"],
};

interface ProjectAISettingsCardProps {
  projectId: string;
}

async function fetchJSON<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  if (response.status === 204) {
    return null as T;
  }
  return (await response.json()) as T;
}

export function ProjectAISettingsCard({ projectId }: ProjectAISettingsCardProps) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_STATE }));
  const [configs, setConfigs] = useState<UserModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        const [settingsPayload, configPayload] = await Promise.all([
          fetchJSON<ProjectAISettings | null>(`/api/projects/${projectId}/ai-settings`),
          fetchJSON<UserModelConfig[]>("/api/model-configs"),
        ]);

        if (!isMounted) return;

        setConfigs(configPayload);
        if (settingsPayload) {
          setForm({
            preferred_mode: settingsPayload.preferred_mode,
            model_config_id: settingsPayload.model_config_id ?? "",
            fallback_provider: settingsPayload.fallback_provider,
            temperature:
              settingsPayload.temperature === null
                ? ""
                : String(settingsPayload.temperature),
            max_output_tokens:
              settingsPayload.max_output_tokens === null
                ? ""
                : String(settingsPayload.max_output_tokens),
            system_prompt: settingsPayload.system_prompt ?? "",
            safety_level: settingsPayload.safety_level,
          });
        } else {
          setForm({ ...DEFAULT_STATE });
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load settings");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void bootstrap();

    async function handleConfigsUpdated() {
      try {
        const freshConfigs = await fetchJSON<UserModelConfig[]>("/api/model-configs");
        if (!isMounted) return;
        setConfigs(freshConfigs);
      } catch (err) {
        console.error(err);
      }
    }

    window.addEventListener(MODEL_CONFIGS_UPDATED_EVENT, handleConfigsUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener(MODEL_CONFIGS_UPDATED_EVENT, handleConfigsUpdated);
    };
  }, [projectId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setStatus(null);

    try {
      const payload = {
        preferred_mode: form.preferred_mode,
        model_config_id: form.model_config_id || null,
        fallback_provider: form.fallback_provider,
        temperature: form.temperature ? Number(form.temperature) : null,
        max_output_tokens: form.max_output_tokens ? Number(form.max_output_tokens) : null,
        system_prompt: form.system_prompt.trim() ? form.system_prompt.trim() : null,
        safety_level: form.safety_level,
      };

      await fetchJSON(`/api/projects/${projectId}/ai-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setStatus("Project AI settings saved");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project AI settings</CardTitle>
        <CardDescription>
          Choose which model powers this project. Defaults fall back to the shared Cowi free tier.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-32 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Preferred mode</Label>
                <Select
                  value={form.preferred_mode}
                  onValueChange={(value: AIUsageMode) => setForm((prev) => ({ ...prev, preferred_mode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fallback provider</Label>
                <Select
                  value={form.fallback_provider}
                  onValueChange={(value: AIProvider) => setForm((prev) => ({ ...prev, fallback_provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Project default model config</Label>
              <Select
                value={form.model_config_id}
                onValueChange={(value) => setForm((prev) => ({ ...prev, model_config_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Use fallback provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use fallback provider</SelectItem>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.label} · {config.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link a saved model config when you want a guaranteed provider/secret for this project.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={form.temperature}
                  onChange={(event) => setForm((prev) => ({ ...prev, temperature: event.target.value }))}
                  placeholder="0.2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-output">Max output tokens</Label>
                <Input
                  id="max-output"
                  type="number"
                  min={0}
                  step={50}
                  value={form.max_output_tokens}
                  onChange={(event) => setForm((prev) => ({ ...prev, max_output_tokens: event.target.value }))}
                  placeholder="800"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Safety level</Label>
                <Select
                  value={form.safety_level}
                  onValueChange={(value: ProjectAISettings["safety_level"]) =>
                    setForm((prev) => ({ ...prev, safety_level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAFETY_LEVELS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="system-prompt">System prompt override</Label>
              <Textarea
                id="system-prompt"
                rows={4}
                value={form.system_prompt}
                onChange={(event) => setForm((prev) => ({ ...prev, system_prompt: event.target.value }))}
                placeholder="Summarize the deployment goal before writing code..."
              />
              <p className="text-xs text-muted-foreground">
                Optional instructions prepended to every call. Leave blank to let templates drive the prompt.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save AI settings"}
              </Button>
              {status && <p className="text-sm text-muted-foreground">{status}</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
