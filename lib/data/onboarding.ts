import { getActiveUserId } from "@/lib/auth";
import { createProjectRecord } from "@/lib/data/projects";
import { getEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { ComboType, OnboardingSession, Database } from "@/lib/types";
import { triggerDeployHook } from "@/lib/deploy";
import type { Json } from "@/supabase/types.gen";

const TABLE = "onboarding_sessions" as const;

type SessionUpdateInput = {
  purpose?: string | null;
  target_audience?: string | null;
  model_preference?: string | null;
  hosting_target?: string | null;
  api_provider?: string | null;
  api_key_last_four?: string | null;
  recommend_template_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

interface FinalizeSessionInput {
  sessionId: string;
  comboType: ComboType;
  stack: string;
  projectTitle: string;
  promptText?: string;
  recommendTemplateId?: string | null;
  metadata?: Record<string, unknown> | null;
}

async function getClient() {
  return createSupabaseServerClient();
}

function extractHookOverride(metadata?: Record<string, unknown> | null) {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const candidate = metadata["vercelHookOverride"];
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate.trim();
  }

  return null;
}

export async function getOrCreateDraftSession(): Promise<OnboardingSession> {
  const supabase = await getClient();
  const userId = getActiveUserId();

  const { data: existing } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing as OnboardingSession;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create onboarding session");
  }

  return data as OnboardingSession;
}

export async function updateOnboardingSession(
  sessionId: string,
  payload: SessionUpdateInput
): Promise<OnboardingSession> {
  const supabase = await getClient();
  const userId = getActiveUserId();

  const updatePayload: Database["public"]["Tables"][typeof TABLE]["Update"] = {
    ...payload,
  } as Database["public"]["Tables"][typeof TABLE]["Update"];

  if (payload.metadata !== undefined) {
    updatePayload.metadata = (payload.metadata ?? null) as Json;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updatePayload)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update onboarding session");
  }

  return data as OnboardingSession;
}

export async function finalizeOnboardingSession({
  sessionId,
  comboType,
  stack,
  projectTitle,
  promptText,
  recommendTemplateId,
  metadata,
}: FinalizeSessionInput) {
  const supabase = await getClient();
  const userId = getActiveUserId();

  const project = await createProjectRecord({
    comboType,
    stack,
    promptText,
    title: projectTitle,
    description: metadata?.summary ? String(metadata.summary) : undefined,
  });

  const hookUrl = extractHookOverride(metadata) ?? getEnv().VERCEL_DEPLOY_HOOK_URL ?? null;
  const { deployTriggeredAt, deployResponse } = await triggerDeployHook(hookUrl);

  const { error } = await supabase
    .from(TABLE)
    .update({
      status: "completed",
      recommend_template_id: recommendTemplateId ?? null,
      metadata: (metadata ?? null) as Json,
      deploy_triggered_at: deployTriggeredAt,
      deploy_response: (deployResponse ?? null) as Json,
      vercel_hook_url: hookUrl,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) {
    console.warn("[onboarding] failed to mark session completed", error.message);
  }

  return project;
}

export async function retriggerOnboardingDeploy(sessionId: string, hookUrlOverride?: string) {
  const supabase = await getClient();
  const userId = getActiveUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    throw error ?? new Error("Onboarding session not found");
  }

  const session = data as OnboardingSession;
  const overrideFromMetadata = extractHookOverride(session.metadata);
  const normalizedOverride = typeof hookUrlOverride === "string" && hookUrlOverride.trim().length > 0
    ? hookUrlOverride.trim()
    : null;

  const hookUrl =
    normalizedOverride ??
    overrideFromMetadata ??
    session.vercel_hook_url ??
    getEnv().VERCEL_DEPLOY_HOOK_URL ??
    null;

  const { deployTriggeredAt, deployResponse } = await triggerDeployHook(hookUrl);

  const { data: updated, error: updateError } = await supabase
    .from(TABLE)
    .update({
      deploy_triggered_at: deployTriggeredAt,
      deploy_response: (deployResponse ?? null) as Json,
      vercel_hook_url: hookUrl,
    })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw updateError ?? new Error("Failed to update onboarding session after deploy retry");
  }

  return updated as OnboardingSession;
}
