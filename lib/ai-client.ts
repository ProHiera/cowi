import { getProjectAISettings, listUserModelConfigs, touchModelConfigUsage } from "@/lib/data/ai";
import { getEnv } from "@/lib/env";
import type {
  AIMessage,
  AIResponse,
  AIUsageMode,
  ResolvedModelConfig,
  UserModelConfig,
} from "@/lib/types";

interface ResolveModelConfigInput {
  userId: string;
  projectId: string;
  mode: AIUsageMode;
}

interface ResolvedConfigResult {
  config: ResolvedModelConfig;
  sourceConfigId: string | null;
}

const MODE_DEFAULT_MODEL: Record<AIUsageMode, string> = {
  chat: "cowi-free-chat",
  prompt_builder: "cowi-free-prompter",
  code_generation: "cowi-free-code",
  analysis: "cowi-free-analyst",
};

const envCache = getEnv();
const SHARED_FREE_MODEL_KEY = envCache.COWI_FREE_MODEL_API_KEY ?? null;
const SHARED_FREE_MODEL_BASE_URL =
  envCache.COWI_FREE_MODEL_BASE_URL ?? "https://api.cowi.dev/free-chat";

function resolveSecretFromConfig(config: UserModelConfig | null) {
  if (!config) {
    return null;
  }

  if (config.metadata?.inline_api_key) {
    return config.metadata.inline_api_key;
  }

  if (config.secret_reference) {
    return process.env[config.secret_reference] ?? null;
  }

  return null;
}

export async function resolveModelConfig({
  userId,
  projectId,
  mode,
}: ResolveModelConfigInput): Promise<ResolvedConfigResult> {
  const [settings, userConfigs] = await Promise.all([
    getProjectAISettings(projectId),
    listUserModelConfigs(userId),
  ]);

  const targetMode: AIUsageMode = settings?.preferred_mode ?? mode;

  const explicit = settings?.model_config_id
    ? userConfigs.find((config) => config.id === settings.model_config_id) ?? null
    : null;

  const fallbackByMode = userConfigs.find((config) => config.mode === targetMode && config.is_default);
  const firstForMode = userConfigs.find((config) => config.mode === targetMode);
  const absoluteDefault = userConfigs.find((config) => config.is_default);

  const chosenConfig = explicit ?? fallbackByMode ?? firstForMode ?? absoluteDefault ?? null;

  const provider = chosenConfig?.provider ?? settings?.fallback_provider ?? "cowi_free";
  const model_name = chosenConfig?.model_name ?? MODE_DEFAULT_MODEL[targetMode];
  const api_key = chosenConfig ? resolveSecretFromConfig(chosenConfig) : SHARED_FREE_MODEL_KEY;

  if (provider !== "cowi_free" && !api_key) {
    throw new Error(`[ai-client] Missing API key for provider ${provider}`);
  }

  const resolved: ResolvedModelConfig = {
    provider,
    model_name,
    mode: chosenConfig?.mode ?? targetMode,
    api_key,
    base_url: chosenConfig?.base_url ?? (provider === "cowi_free" ? SHARED_FREE_MODEL_BASE_URL : null),
    metadata: chosenConfig?.metadata ?? null,
    temperature: settings?.temperature ?? null,
    max_output_tokens: settings?.max_output_tokens ?? null,
    system_prompt: settings?.system_prompt ?? null,
    safety_level: settings?.safety_level ?? "balanced",
  };

  return {
    config: resolved,
    sourceConfigId: chosenConfig?.id ?? null,
  };
}

interface ExecuteAIRequestParams {
  userId: string;
  projectId: string;
  mode: AIUsageMode;
  prompt: string;
  messages?: AIMessage[];
  signal?: AbortSignal;
}

export async function executeAIRequest(params: ExecuteAIRequestParams): Promise<AIResponse> {
  const { config, sourceConfigId } = await resolveModelConfig(params);
  const response = await callProvider(config, params);

  if (sourceConfigId) {
    touchModelConfigUsage(sourceConfigId).catch((error) =>
      console.warn("[ai-client] failed to mark usage", error)
    );
  }

  return response;
}

async function callProvider(config: ResolvedModelConfig, params: ExecuteAIRequestParams) {
  switch (config.provider) {
    case "cowi_free":
      return runFreeModel(config, params);
    case "openai":
      return runOpenAI(config, params);
    default:
      return runGenericJSONProvider(config, params);
  }
}

function buildMessages(config: ResolvedModelConfig, prompt: string, messages?: AIMessage[]) {
  const baseMessages = messages && messages.length > 0 ? messages : [{ role: "user", content: prompt }];

  if (config.system_prompt) {
    return [{ role: "system", content: config.system_prompt }, ...baseMessages];
  }

  return baseMessages;
}

function runFreeModel(config: ResolvedModelConfig, params: ExecuteAIRequestParams): AIResponse {
  const excerpt = params.prompt.trim().slice(0, 400);
  const output = `Preview (${config.mode}): ${excerpt}

Next steps:
- Upgrade to a pro model or plug in your own key to get live generations.
- Use project AI settings to fine-tune temperature, safety, and provider.`;

  return {
    output,
    provider: config.provider,
    model: config.model_name,
    raw: { simulated: true },
  };
}

async function runOpenAI(config: ResolvedModelConfig, params: ExecuteAIRequestParams): Promise<AIResponse> {
  if (!config.api_key) {
    throw new Error("[ai-client] Missing OpenAI API key");
  }

  const response = await fetch(config.base_url ?? "https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.api_key}`,
    },
    body: JSON.stringify({
      model: config.model_name,
      temperature: config.temperature ?? 0.2,
      max_tokens: config.max_output_tokens ?? 800,
      messages: buildMessages(config, params.prompt, params.messages),
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`[ai-client] OpenAI request failed: ${response.status} ${errorBody}`);
  }

  const json = await response.json();
  const output = json.choices?.[0]?.message?.content?.trim() ?? "";

  return {
    output,
    provider: config.provider,
    model: config.model_name,
    raw: json,
  };
}

async function runGenericJSONProvider(
  config: ResolvedModelConfig,
  params: ExecuteAIRequestParams
): Promise<AIResponse> {
  if (!config.base_url) {
    throw new Error(`[ai-client] Missing base URL for provider ${config.provider}`);
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.api_key) {
    headers.Authorization = `Bearer ${config.api_key}`;
  }

  const response = await fetch(config.base_url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model_name,
      mode: config.mode,
      prompt: params.prompt,
      temperature: config.temperature,
      max_output_tokens: config.max_output_tokens,
      messages: buildMessages(config, params.prompt, params.messages),
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`[ai-client] Provider request failed: ${response.status} ${errorBody}`);
  }

  const json = await response.json();
  const output = json.output ?? json.choices?.[0]?.message?.content ?? json.response ?? "";

  return {
    output: typeof output === "string" ? output : JSON.stringify(output),
    provider: config.provider,
    model: config.model_name,
    raw: json,
  };
}
