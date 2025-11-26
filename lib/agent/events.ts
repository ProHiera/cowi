import { getActiveUserId } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { AgentEvent, AgentEventStatus, AgentEventType } from "@/lib/types";
import type { Json } from "@/supabase/types.gen";

const TABLE = "agent_events" as const;

interface CreateAgentEventInput {
  eventType: AgentEventType;
  source?: "vscode" | "web";
  payload: Record<string, unknown>;
  language?: string | null;
  filePath?: string | null;
  originalSnippet?: string | null;
  proposedSnippet?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface ListAgentEventsOptions {
  limit?: number;
  status?: AgentEventStatus;
}

interface UpdateAgentEventPayload {
  status?: AgentEventStatus;
  detected_language?: string | null;
  translated_text?: string | null;
  summary?: string | null;
  root_cause?: Array<{ title: string; detail: string; confidence: number }> | null;
  fix_patch?: string | null;
  fix_status?: AgentEvent["fix_status"];
  resolution_notes?: string | null;
  metadata?: Record<string, unknown> | null;
}

export type AgentEventUpdateInput = UpdateAgentEventPayload;

export async function createAgentEvent(input: CreateAgentEventInput) {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      event_type: input.eventType,
      source: input.source ?? "vscode",
      payload: (input.payload ?? {}) as Json,
      language: input.language ?? null,
      file_path: input.filePath ?? null,
      original_snippet: input.originalSnippet ?? null,
      proposed_snippet: input.proposedSnippet ?? null,
      metadata: (input.metadata ?? null) as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[agent-events] create failed", error?.message);
    throw error ?? new Error("Unable to create agent event");
  }

  return data as AgentEvent;
}

export async function listAgentEvents(options: ListAgentEventsOptions = {}) {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 20);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[agent-events] list failed", error.message);
    return [];
  }

  return (data ?? []) as AgentEvent[];
}

export async function getAgentEventById(id: string) {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[agent-events] fetch failed", error.message);
    return null;
  }

  return data ? (data as AgentEvent) : null;
}

export async function updateAgentEventRecord(id: string, payload: AgentEventUpdateInput) {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();

  const updatePayload: Record<string, unknown> = {};
  if (payload.status) updatePayload.status = payload.status;
  if (payload.detected_language !== undefined) updatePayload.detected_language = payload.detected_language;
  if (payload.translated_text !== undefined) updatePayload.translated_text = payload.translated_text;
  if (payload.summary !== undefined) updatePayload.summary = payload.summary;
  if (payload.root_cause !== undefined) updatePayload.root_cause = (payload.root_cause ?? null) as Json;
  if (payload.fix_patch !== undefined) updatePayload.fix_patch = payload.fix_patch;
  if (payload.fix_status !== undefined) updatePayload.fix_status = payload.fix_status;
  if (payload.resolution_notes !== undefined) updatePayload.resolution_notes = payload.resolution_notes;
  if (payload.metadata !== undefined) updatePayload.metadata = (payload.metadata ?? null) as Json;

  const { data, error } = await supabase
    .from(TABLE)
    .update(updatePayload)
    .eq("user_id", userId)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[agent-events] update failed", error?.message);
    throw error ?? new Error("Unable to update agent event");
  }

  return data as AgentEvent;
}
