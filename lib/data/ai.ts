import type { SupabaseClient } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type {
  AIProvider,
  AIUsageMode,
  Database,
  ProjectAISettings,
  UserModelConfig,
} from "@/lib/types";

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
    .order("is_default", { ascending: false })
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

type UserModelConfigEditableFields = Pick<
  UserModelConfig,
  | "label"
  | "provider"
  | "model_name"
  | "mode"
  | "secret_reference"
  | "api_key_last_four"
  | "base_url"
  | "metadata"
  | "is_default"
>;

export type CreateUserModelConfigInput = Pick<
  UserModelConfigEditableFields,
  "label" | "provider" | "model_name" | "mode"
> &
  Partial<
    Pick<
      UserModelConfigEditableFields,
      "secret_reference" | "api_key_last_four" | "base_url" | "metadata" | "is_default"
    >
  >;

export type UpdateUserModelConfigInput = Partial<UserModelConfigEditableFields>;

function normalizeOptionalText(value?: string | null) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function ensureSingleDefault(userId: string, configIdToSkip?: string) {
  const supabase = getClient();
  let query = supabase
    .from(USER_MODEL_CONFIGS_TABLE)
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("is_default", true);

  if (configIdToSkip) {
    query = query.neq("id", configIdToSkip);
  }

  const { error } = await query;
  if (error) {
    logAndThrow("failed to clear existing default model configs", error);
  }
}

function buildInsertPayload(userId: string, input: CreateUserModelConfigInput) {
  return {
    user_id: userId,
    label: input.label.trim(),
    provider: input.provider,
    model_name: input.model_name.trim(),
    mode: input.mode,
    secret_reference: normalizeOptionalText(input.secret_reference),
    api_key_last_four: normalizeOptionalText(input.api_key_last_four),
    base_url: normalizeOptionalText(input.base_url),
    metadata: input.metadata ?? null,
    is_default: Boolean(input.is_default),
  };
}

function buildUpdatePayload(input: UpdateUserModelConfigInput) {
  const payload: Record<string, unknown> = {};

  if (input.label !== undefined) {
    payload.label = input.label.trim();
  }
  if (input.provider !== undefined) {
    payload.provider = input.provider as AIProvider;
  }
  if (input.model_name !== undefined) {
    payload.model_name = input.model_name.trim();
  }
  if (input.mode !== undefined) {
    payload.mode = input.mode;
  }
  if (input.secret_reference !== undefined) {
    payload.secret_reference = normalizeOptionalText(input.secret_reference);
  }
  if (input.api_key_last_four !== undefined) {
    payload.api_key_last_four = normalizeOptionalText(input.api_key_last_four);
  }
  if (input.base_url !== undefined) {
    payload.base_url = normalizeOptionalText(input.base_url);
  }
  if (input.metadata !== undefined) {
    payload.metadata = input.metadata ?? null;
  }
  if (input.is_default !== undefined) {
    payload.is_default = input.is_default;
  }

  return payload;
}

export async function createUserModelConfig(userId: string, input: CreateUserModelConfigInput) {
  if (input.is_default) {
    await ensureSingleDefault(userId);
  }

  const supabase = getClient();
  const { data, error } = await supabase
    .from(USER_MODEL_CONFIGS_TABLE)
    .insert(buildInsertPayload(userId, input))
    .select("*")
    .single();

  if (error) {
    logAndThrow("failed to create user model config", error);
  }

  return data as UserModelConfig;
}

export async function updateUserModelConfig(
  userId: string,
  configId: string,
  input: UpdateUserModelConfigInput
) {
  if (input.is_default) {
    await ensureSingleDefault(userId, configId);
  }

  const payload = buildUpdatePayload(input);
  if (Object.keys(payload).length === 0) {
    return getUserModelConfigById(userId, configId);
  }

  const supabase = getClient();
  const { data, error } = await supabase
    .from(USER_MODEL_CONFIGS_TABLE)
    .update(payload)
    .eq("user_id", userId)
    .eq("id", configId)
    .select("*")
    .single();

  if (error) {
    logAndThrow("failed to update user model config", error);
  }

  return data as UserModelConfig;
}

export async function deleteUserModelConfig(userId: string, configId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from(USER_MODEL_CONFIGS_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("id", configId);

  if (error) {
    logAndThrow("failed to delete user model config", error);
  }
}

export async function touchModelConfigUsage(configId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from(USER_MODEL_CONFIGS_TABLE)
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
