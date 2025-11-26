import type { CreateUserModelConfigInput, UpdateUserModelConfigInput } from "@/lib/data/ai";
import type { AIProvider, AIUsageMode } from "@/lib/types";

const PROVIDERS: AIProvider[] = [
  "cowi_free",
  "openai",
  "anthropic",
  "azure_openai",
  "google",
  "custom",
];

const MODES: AIUsageMode[] = ["chat", "prompt_builder", "code_generation", "analysis"];

function ensureProvider(value: unknown): AIProvider {
  if (typeof value !== "string" || !PROVIDERS.includes(value as AIProvider)) {
    throw new Error("Invalid provider. Expected one of: " + PROVIDERS.join(", "));
  }
  return value as AIProvider;
}

function ensureMode(value: unknown): AIUsageMode {
  if (typeof value !== "string" || !MODES.includes(value as AIUsageMode)) {
    throw new Error("Invalid mode. Expected one of: " + MODES.join(", "));
  }
  return value as AIUsageMode;
}

function normalizeMetadata(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  let source = value;
  if (typeof value === "string") {
    try {
      source = JSON.parse(value);
    } catch {
      throw new Error("Metadata must be valid JSON");
    }
  }

  if (typeof source !== "object" || Array.isArray(source) || source === null) {
    throw new Error("Metadata must be a JSON object");
  }

  const entries = Object.entries(source as Record<string, unknown>);
  const result: Record<string, string> = {};
  for (const [key, val] of entries) {
    if (!key) {
      continue;
    }
    result[key] = typeof val === "string" ? val : JSON.stringify(val ?? null);
  }
  return result;
}

function coerceBoolean(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (["true", "1", "yes"].includes(value.toLowerCase())) {
      return true;
    }
    if (["false", "0", "no"].includes(value.toLowerCase())) {
      return false;
    }
  }

  throw new Error("is_default must be a boolean value");
}

function sanitizeText(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error("Expected a string");
  }

  return value.trim();
}

export function parseCreateModelConfigPayload(body: unknown): CreateUserModelConfigInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("Payload must be an object");
  }

  const payload = body as Record<string, unknown>;
  const label = sanitizeText(payload.label);
  const modelName = sanitizeText(payload.model_name);

  if (!label) {
    throw new Error("label is required");
  }
  if (!modelName) {
    throw new Error("model_name is required");
  }

  return {
    label,
    provider: ensureProvider(payload.provider),
    model_name: modelName,
    mode: ensureMode(payload.mode),
    secret_reference: sanitizeText(payload.secret_reference) ?? null,
    api_key_last_four: sanitizeText(payload.api_key_last_four) ?? null,
    base_url: sanitizeText(payload.base_url) ?? null,
    metadata: normalizeMetadata(payload.metadata),
    is_default: coerceBoolean(payload.is_default),
  };
}

export function parseUpdateModelConfigPayload(body: unknown): UpdateUserModelConfigInput {
  if (typeof body !== "object" || body === null) {
    throw new Error("Payload must be an object");
  }

  const payload = body as Record<string, unknown>;
  const nextPayload: UpdateUserModelConfigInput = {};

  if (payload.label !== undefined) {
    const label = sanitizeText(payload.label);
    if (!label) {
      throw new Error("label cannot be empty");
    }
    nextPayload.label = label;
  }
  if (payload.provider !== undefined) {
    nextPayload.provider = ensureProvider(payload.provider);
  }
  if (payload.model_name !== undefined) {
    const modelName = sanitizeText(payload.model_name);
    if (!modelName) {
      throw new Error("model_name cannot be empty");
    }
    nextPayload.model_name = modelName;
  }
  if (payload.mode !== undefined) {
    nextPayload.mode = ensureMode(payload.mode);
  }
  if (payload.secret_reference !== undefined) {
    nextPayload.secret_reference = sanitizeText(payload.secret_reference) ?? null;
  }
  if (payload.api_key_last_four !== undefined) {
    nextPayload.api_key_last_four = sanitizeText(payload.api_key_last_four) ?? null;
  }
  if (payload.base_url !== undefined) {
    nextPayload.base_url = sanitizeText(payload.base_url) ?? null;
  }
  if (payload.metadata !== undefined) {
    nextPayload.metadata = normalizeMetadata(payload.metadata);
  }
  if (payload.is_default !== undefined) {
    const boolValue = coerceBoolean(payload.is_default);
    if (boolValue === undefined) {
      throw new Error("is_default cannot be empty");
    }
    nextPayload.is_default = boolValue;
  }

  if (Object.keys(nextPayload).length === 0) {
    throw new Error("At least one field must be provided for update");
  }

  return nextPayload;
}
