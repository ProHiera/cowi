import { NextResponse } from "next/server";

import { getProjectAISettings, upsertProjectAISettings } from "@/lib/data/ai";
import type { AIProvider, AIUsageMode, ProjectAISettings } from "@/lib/types";

const PROVIDERS: AIProvider[] = [
  "cowi_free",
  "openai",
  "anthropic",
  "azure_openai",
  "google",
  "custom",
];

const MODES: AIUsageMode[] = ["chat", "prompt_builder", "code_generation", "analysis"];
const SAFETY_LEVELS: ProjectAISettings["safety_level"][] = [
  "strict",
  "balanced",
  "creative",
];

interface RouteParams {
  params: { id: string };
}

function parseSettingsPayload(raw: unknown) {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Payload must be an object");
  }

  const body = raw as Record<string, unknown>;
  const preferred_mode = body.preferred_mode;
  const fallback_provider = body.fallback_provider;
  const safety_level = body.safety_level;
  const system_prompt = typeof body.system_prompt === "string" ? body.system_prompt.trim() : null;

  if (typeof preferred_mode !== "string" || !MODES.includes(preferred_mode as AIUsageMode)) {
    throw new Error("preferred_mode is required");
  }
  if (typeof fallback_provider !== "string" || !PROVIDERS.includes(fallback_provider as AIProvider)) {
    throw new Error("fallback_provider is required");
  }
  if (typeof safety_level !== "string" || !SAFETY_LEVELS.includes(safety_level as ProjectAISettings["safety_level"])) {
    throw new Error("safety_level is required");
  }

  const temperature = body.temperature === null || body.temperature === ""
    ? null
    : Number(body.temperature);
  const max_output_tokens = body.max_output_tokens === null || body.max_output_tokens === ""
    ? null
    : Number(body.max_output_tokens);

  if (temperature !== null && Number.isNaN(temperature)) {
    throw new Error("temperature must be a number");
  }
  if (max_output_tokens !== null && (!Number.isFinite(max_output_tokens) || max_output_tokens < 0)) {
    throw new Error("max_output_tokens must be a positive number");
  }

  const model_config_id = typeof body.model_config_id === "string" && body.model_config_id.trim().length
    ? body.model_config_id.trim()
    : null;

  return {
    preferred_mode: preferred_mode as AIUsageMode,
    fallback_provider: fallback_provider as AIProvider,
    safety_level: safety_level as ProjectAISettings["safety_level"],
    model_config_id,
    temperature,
    max_output_tokens: max_output_tokens === null ? null : Math.round(max_output_tokens),
    system_prompt: system_prompt && system_prompt.length ? system_prompt : null,
  };
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const settings = await getProjectAISettings(params.id);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[api/projects/:id/ai-settings] failed to fetch", error);
    return NextResponse.json({ message: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const payload = parseSettingsPayload(await request.json());
    const result = await upsertProjectAISettings({ projectId: params.id, payload });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/projects/:id/ai-settings] failed to save", error);
    const message = error instanceof Error ? error.message : "Failed to save settings";
    const normalized = message.toLowerCase();
    const status = normalized.includes("required") || normalized.includes("number") ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
