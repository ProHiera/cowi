import { buildUnifiedDiff } from "@/lib/agent/diffs";
import { createAgentEvent, getAgentEventById, updateAgentEventRecord } from "@/lib/agent/events";
import { summarizeText, translateText } from "@/lib/agent/llm";
import type { AgentEvent } from "@/lib/types";

export async function processAgentEvent(eventId: string) {
  const event = await getAgentEventById(eventId);
  if (!event) {
    return null;
  }

  await updateAgentEventRecord(eventId, { status: "processing" });

  try {
    const rawText = extractEventText(event);
    const detectedLanguage = event.language ?? detectLanguage(rawText);
    const translated =
      detectedLanguage && detectedLanguage !== "en"
        ? await translateText(rawText, detectedLanguage)
        : rawText;

    const summary = translated ? await summarizeText(translated) : null;
    const hypotheses = buildRootCauseHypotheses(translated ?? rawText);
    const patch = buildUnifiedDiff({
      filePath: event.file_path,
      original: event.original_snippet,
      proposed: event.proposed_snippet,
    });

    const updated = await updateAgentEventRecord(eventId, {
      status: "ready",
      detected_language: detectedLanguage,
      translated_text: translated ?? rawText ?? null,
      summary,
      root_cause: hypotheses,
      fix_patch: patch,
    });

    return updated;
  } catch (error) {
    console.error("[agent-events] processing failed", error);
    await updateAgentEventRecord(eventId, { status: "error" });
    return null;
  }
}

export async function ingestAndProcessAgentEvent(input: Parameters<typeof createAgentEvent>[0]) {
  const event = await createAgentEvent(input);
  const processed = await processAgentEvent(event.id);
  return processed ?? event;
}

function extractEventText(event: AgentEvent) {
  const payload = event.payload ?? {};
  if (typeof payload["text"] === "string") {
    return payload["text"] as string;
  }
  if (typeof payload["message"] === "string") {
    return payload["message"] as string;
  }
  if (typeof payload["stderr"] === "string") {
    return payload["stderr"] as string;
  }
  if (typeof payload["stdout"] === "string") {
    return payload["stdout"] as string;
  }
  return event.summary ?? "";
}

function detectLanguage(text: string | undefined) {
  if (!text) return null;
  const hangul = /[\u3131-\u318E\uAC00-\uD7A3]/;
  if (hangul.test(text)) {
    return "ko";
  }
  return "en";
}

function buildRootCauseHypotheses(text?: string | null) {
  if (!text) return null;
  const hypotheses: Array<{ title: string; detail: string; confidence: number }> = [];
  const lowered = text.toLowerCase();

  if (lowered.includes("undefined") || lowered.includes("null")) {
    hypotheses.push({
      title: "Null or undefined reference",
      detail: "A variable is accessed before being defined. Check recent refactors or optional chaining.",
      confidence: 0.7,
    });
  }

  if (lowered.includes("timeout")) {
    hypotheses.push({
      title: "Network or build timeout",
      detail: "Requests exceed default timeout. Consider retry logic or bumping timeouts.",
      confidence: 0.5,
    });
  }

  if (lowered.includes("module not found") || lowered.includes("cannot find module")) {
    hypotheses.push({
      title: "Missing dependency",
      detail: "npm dependency missing or path incorrect. Reinstall packages or adjust import path.",
      confidence: 0.6,
    });
  }

  if (!hypotheses.length) {
    hypotheses.push({
      title: "Review recent changes",
      detail: "Unable to auto-classify. Inspect the log and rerun tests with verbose output.",
      confidence: 0.3,
    });
  }

  return hypotheses;
}
