import { randomUUID } from "crypto";

import { FALLBACK_PROMPTS } from "@/lib/constants";
import { getActiveUserId } from "@/lib/auth";
import { getEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type {
  AIProvider,
  ComboType,
  PromptLibraryEntry,
  PromptRecommendation,
  PromptUsageLog,
} from "@/lib/types";
import type { Json } from "@/supabase/types.gen";

const ENTRY_TABLE = "prompt_library_entries" as const;
const LOG_TABLE = "prompt_usage_logs" as const;
const RECOMMENDATION_CACHE_TTL_MS = 15 * 60 * 1000;

const recommendationCache = new Map<
  string,
  { expiresAt: number; data: PromptRecommendation[] }
>();

interface ListPromptOptions {
  tag?: string;
  query?: string;
  includeShared?: boolean;
  limit?: number;
}

interface PromptPayload {
  title: string;
  content: string;
  summary?: string | null;
  comboType?: ComboType | "all";
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  isShared?: boolean;
}

interface LogPromptUsageInput {
  promptId?: string;
  projectId?: string;
  comboType?: ComboType;
  provider?: AIProvider;
  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;
  metadata?: Record<string, unknown> | null;
}

interface RecommendationContext {
  comboType?: ComboType;
  tags?: string[];
  purpose?: string;
  limit?: number;
}

export async function listPromptLibraryEntries(
  options: ListPromptOptions = {}
): Promise<PromptLibraryEntry[]> {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();
  const includeShared = options.includeShared ?? true;

  let query = supabase
    .from(ENTRY_TABLE)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(options.limit ?? 100);

  if (options.query) {
    query = query.ilike("title", `%${options.query}%`);
  }

  if (options.tag) {
    query = query.contains("tags", [options.tag]);
  }

  if (includeShared) {
    query = query.or(`user_id.eq.${userId},is_shared.eq.true`);
  } else {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[prompt-library] list error", error.message);
    return [];
  }

  return (data ?? []) as PromptLibraryEntry[];
}

export async function getPromptEntryById(id: string): Promise<PromptLibraryEntry | null> {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();

  const { data, error } = await supabase
    .from(ENTRY_TABLE)
    .select("*")
    .eq("id", id)
    .or(`user_id.eq.${userId},is_shared.eq.true`)
    .maybeSingle();

  if (error) {
    console.error("[prompt-library] fetch error", error.message);
    return null;
  }

  return (data as PromptLibraryEntry) ?? null;
}

export async function createPromptEntry(payload: PromptPayload): Promise<PromptLibraryEntry> {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();

  const { data, error } = await supabase
    .from(ENTRY_TABLE)
    .insert({
      user_id: userId,
      title: payload.title,
      summary: payload.summary ?? null,
      content: payload.content,
      combo_type: payload.comboType ?? "all",
      tags: normalizeTags(payload.tags),
      metadata: (payload.metadata ?? null) as Json,
      is_shared: payload.isShared ?? false,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[prompt-library] create error", error?.message);
    throw error ?? new Error("Failed to create prompt");
  }

  return data as PromptLibraryEntry;
}

export async function updatePromptEntry(
  id: string,
  payload: Partial<PromptPayload>
): Promise<PromptLibraryEntry> {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();

  const updatePayload: Record<string, unknown> = {};

  if (payload.title !== undefined) updatePayload.title = payload.title;
  if (payload.summary !== undefined) updatePayload.summary = payload.summary;
  if (payload.content !== undefined) updatePayload.content = payload.content;
  if (payload.comboType !== undefined) updatePayload.combo_type = payload.comboType;
  if (payload.tags !== undefined) updatePayload.tags = normalizeTags(payload.tags);
  if (payload.metadata !== undefined) updatePayload.metadata = (payload.metadata ?? null) as Json;
  if (payload.isShared !== undefined) updatePayload.is_shared = payload.isShared;

  const { data, error } = await supabase
    .from(ENTRY_TABLE)
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update prompt");
  }

  return data as PromptLibraryEntry;
}

export async function deletePromptEntry(id: string) {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();

  const { error } = await supabase.from(ENTRY_TABLE).delete().eq("id", id).eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function logPromptUsage({
  promptId,
  projectId,
  comboType,
  provider,
  tokensInput,
  tokensOutput,
  costUsd,
  metadata,
}: LogPromptUsageInput) {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();

  const { error } = await supabase.from(LOG_TABLE).insert({
    user_id: userId,
    prompt_id: promptId ?? null,
    project_id: projectId ?? null,
    combo_type: comboType ?? null,
    provider: provider ?? null,
    tokens_input: tokensInput ?? null,
    tokens_output: tokensOutput ?? null,
    cost_usd: costUsd ?? null,
    metadata: (metadata ?? null) as Json,
  });

  if (error) {
    console.error("[prompt-library] usage log error", error.message);
  }

  if (promptId) {
    await incrementUsageCount(promptId);
  }
}

export async function getPromptRecommendations(
  context: RecommendationContext = {}
): Promise<PromptRecommendation[]> {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();
  const limit = context.limit ?? 8;
  const cacheKey = buildCacheKey(userId, context);
  const cached = recommendationCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data.slice(0, limit);
  }

  let query = supabase
    .from(ENTRY_TABLE)
    .select("*")
    .or(`user_id.eq.${userId},is_shared.eq.true`)
    .order("usage_count", { ascending: false })
    .limit(100);

  if (context.comboType) {
    query = query.or(`combo_type.eq.${context.comboType},combo_type.eq.all`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[prompt-library] recommendations fetch error", error.message);
  }

  const entries = (data ?? []) as PromptLibraryEntry[];
  const contextTags = deriveContextTags(context.tags, context.purpose);

  const scored: PromptRecommendation[] = entries.map((entry) => {
    const scoreBreakdown = calculateScore(entry, context.comboType, contextTags);
    return {
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      combo_type: entry.combo_type,
      tags: entry.tags,
      content: entry.content,
      score: scoreBreakdown.score,
      reason: scoreBreakdown.reason,
      source: "rule",
    };
  });

  if (scored.length < limit) {
    const fallback = buildFallbackRecommendations(context.comboType, contextTags);
    scored.push(...fallback);
  }

  const suggestionsFromLLM = await buildLLMRecommendations(context, contextTags);
  if (suggestionsFromLLM.length) {
    scored.push(...suggestionsFromLLM);
  }

  const unique = dedupeRecommendations(scored);

  const ranked = unique
    .sort((a, b) => b.score - a.score)
    .map((rec, index) => ({ ...rec, score: rec.score + Math.max(0, limit - index) * 0.01 }));

  const sliced = ranked.slice(0, limit);
  recommendationCache.set(cacheKey, { data: ranked, expiresAt: Date.now() + RECOMMENDATION_CACHE_TTL_MS });
  return sliced;
}

async function incrementUsageCount(promptId: string) {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();

  const { data, error } = await supabase
    .from(ENTRY_TABLE)
    .select("usage_count")
    .eq("id", promptId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return;
  }

  await supabase
    .from(ENTRY_TABLE)
    .update({ usage_count: (data.usage_count ?? 0) + 1 })
    .eq("id", promptId)
    .eq("user_id", userId);
}

function normalizeTags(tags?: string[]) {
  if (!tags?.length) return [];
  return tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

function deriveContextTags(baseTags?: string[], purpose?: string) {
  const tags = new Set<string>((baseTags ?? []).map((tag) => tag.toLowerCase()));
  if (purpose) {
    purpose
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3)
      .forEach((word) => tags.add(word));
  }

  return Array.from(tags);
}

function calculateScore(
  entry: PromptLibraryEntry,
  comboType?: ComboType,
  contextTags: string[] = []
) {
  let score = entry.usage_count * 0.5;
  const reasons: string[] = [];

  if (comboType && (entry.combo_type === comboType || entry.combo_type === "all")) {
    score += 3;
    reasons.push(`Combo: ${comboType}`);
  }

  const overlap = intersection(entry.tags, contextTags);
  if (overlap.length) {
    score += overlap.length * 1.5;
    reasons.push(`Tags: ${overlap.join(", ")}`);
  }

  if (!reasons.length) {
    reasons.push("Popular prompt");
  }

  return { score, reason: reasons.join(" · ") };
}

function intersection(a: string[] = [], b: string[] = []) {
  const setB = new Set(b.map((item) => item.toLowerCase()));
  return a.filter((item) => setB.has(item.toLowerCase()));
}

function buildFallbackRecommendations(comboType?: ComboType, contextTags: string[] = []) {
  return FALLBACK_PROMPTS.map((prompt) => {
    const overlap = intersection(prompt.tags, contextTags);
    const comboBonus = comboType && (prompt.combo_type === comboType || prompt.combo_type === "all") ? 1 : 0;
    return {
      id: prompt.id,
      title: prompt.title,
      summary: prompt.description,
      combo_type: prompt.combo_type,
      tags: prompt.tags,
      content: prompt.content,
      score: 1 + overlap.length + comboBonus,
      reason: overlap.length ? `Fallback tag match (${overlap.join(", ")})` : "Fallback template",
      source: "fallback" as const,
    } satisfies PromptRecommendation;
  });
}

function dedupeRecommendations(entries: PromptRecommendation[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });
}

export async function listPromptUsageLogs(options: { limit?: number } = {}): Promise<PromptUsageLog[]> {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();
  const { data, error } = await supabase
    .from(LOG_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 20);

  if (error) {
    console.error("[prompt-library] usage logs error", error.message);
    return [];
  }

  return (data ?? []) as PromptUsageLog[];
}

export async function tryLLMSuggestion(context: RecommendationContext) {
  const { PROMPT_SUGGESTION_MODEL, PROMPT_SUGGESTION_PROVIDER_KEY } = getEnv();
  if (!PROMPT_SUGGESTION_MODEL || !PROMPT_SUGGESTION_PROVIDER_KEY) {
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PROMPT_SUGGESTION_PROVIDER_KEY}`,
      },
      body: JSON.stringify({
        model: PROMPT_SUGGESTION_MODEL,
        input: buildSuggestionPrompt(context),
      }),
    });

    if (!response.ok) {
      console.warn("[prompt-library] suggestion model error", response.statusText);
      return null;
    }

    const data = (await response.json()) as { output?: Array<{ content?: Array<{ text?: { value: string } }> }> };
    const text = data.output?.[0]?.content?.[0]?.text?.value;
    if (!text) {
      return null;
    }

    return text;
  } catch (error) {
    console.warn("[prompt-library] suggestion model request failed", error);
    return null;
  }
}

function buildSuggestionPrompt(context: RecommendationContext) {
  const parts = [
    "You are a prompt recommendation agent for an internal deployment tool.",
    `Combo type: ${context.comboType ?? "unknown"}.`,
  ];
  if (context.tags?.length) {
    parts.push(`Tags: ${context.tags.join(", ")}.`);
  }
  if (context.purpose) {
    parts.push(`Purpose: ${context.purpose}.`);
  }
  parts.push("Suggest three short prompt titles and reasons in JSON array format.");
  return parts.join(" ");
}

function buildCacheKey(userId: string, context: RecommendationContext) {
  const tags = [...(context.tags ?? [])].sort().join(",");
  return `${userId}:${context.comboType ?? "all"}:${tags}:${context.purpose ?? ""}`;
}

async function buildLLMRecommendations(
  context: RecommendationContext,
  contextTags: string[]
) {
  const suggestionText = await tryLLMSuggestion(context);
  if (!suggestionText) {
    return [];
  }

  try {
    const parsed = JSON.parse(suggestionText) as Array<{
      title?: string;
      reason?: string;
      content?: string;
      prompt?: string;
      tags?: string[];
    }>;

    return parsed
      .filter((item) => item?.title)
      .map((item, index) => ({
        id: `llm-${randomUUID()}-${index}`,
        title: item.title ?? "LLM suggestion",
        summary: item.reason ?? null,
        combo_type: context.comboType ?? "all",
        tags: normalizeTags(item.tags ?? contextTags.slice(0, 3)),
        content: item.content ?? item.prompt ?? item.title ?? "",
        score: 1.25,
        reason: item.reason ?? "LLM suggestion aligned with recent usage",
        source: "llm" as const,
      } satisfies PromptRecommendation))
      .slice(0, 3);
  } catch (error) {
    console.warn("[prompt-library] failed to parse llm suggestions", error);
    return [];
  }
}
