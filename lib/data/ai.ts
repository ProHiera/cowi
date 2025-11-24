import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { AIUsageMode, Database, ProjectAISettings, UserModelConfig } from "@/lib/types";

const USER_MODEL_CONFIGS_TABLE: keyof Database["public"]["Tables"] & "user_model_configs" =
  "user_model_configs";
const PROJECT_AI_SETTINGS_TABLE: keyof Database["public"]["Tables"] & "project_ai_settings" =
  "project_ai_settings";

function getClient() {
  return createSupabaseServerClient() as unknown as SupabaseClient<Database>;
}

function logAndThrow(context: string, error: unknown) {
  console.error(`[ai-data] ${context}`, error);
  throw error instanceof Error ? error : new Error(String(error));
}

export async function listUserModelConfigs(userId: string): Promise<UserModelConfig[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from(USER_MODEL_CONFIGS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    logAndThrow("failed to list user model configs", error);
  }

  return (data ?? []) as UserModelConfig[];
}

export async function getUserModelConfigById(userId: string, configId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from(USER_MODEL_CONFIGS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("id", configId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    logAndThrow("failed to fetch user model config", error);
  }

  if (!data) {
    return null;
  }

  return data as UserModelConfig;
}

export async function getDefaultModelConfigForMode(userId: string, mode?: AIUsageMode) {
  const supabase = getClient();
  let query = supabase.from(USER_MODEL_CONFIGS_TABLE).select("*").eq("user_id", userId);

  if (mode) {
    query = query.eq("mode", mode);
  }

  const { data, error } = await query
    .order("is_default", { ascending: false })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    logAndThrow("failed to fetch default model config", error);
  }

  return (data?.[0] as UserModelConfig | undefined) ?? null;
}

export async function touchModelConfigUsage(configId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from(USER_MODEL_CONFIGS_TABLE)
    // @ts-expect-error Supabase generated types do not include the AI tables yet.
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", configId);

  if (error) {
    console.warn("[ai-data] failed to touch usage", error.message);
  }
}

export async function getProjectAISettings(projectId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from(PROJECT_AI_SETTINGS_TABLE)
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) {
    logAndThrow("failed to fetch project ai settings", error);
  }

  return (data as ProjectAISettings | null) ?? null;
}

export interface UpsertProjectAISettingsInput {
  projectId: string;
  payload: Partial<Pick<ProjectAISettings, "preferred_mode" | "model_config_id" | "fallback_provider" | "temperature" | "max_output_tokens" | "system_prompt" | "safety_level" >>;
}

export async function upsertProjectAISettings({ projectId, payload }: UpsertProjectAISettingsInput) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from(PROJECT_AI_SETTINGS_TABLE)
    // @ts-expect-error Supabase generated types do not include the AI tables yet.
    .upsert({
      project_id: projectId,
      ...payload,
    })
    .select("*")
    .single();

  if (error) {
    logAndThrow("failed to upsert project ai settings", error);
  }

  if (!data) {
    throw new Error("[ai-data] upsert did not return a row");
  }

  return data as ProjectAISettings;
}
