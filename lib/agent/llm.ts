import { getEnv } from "@/lib/env";

interface LLMResponse {
  content: string | null;
}

export async function translateText(input: string, sourceLanguage: string | null) {
  const { AGENT_TRANSLATION_MODEL, AGENT_ASSIST_PROVIDER_KEY } = getEnv();
  if (!AGENT_TRANSLATION_MODEL || !AGENT_ASSIST_PROVIDER_KEY || !input.trim()) {
    return null;
  }

  const prompt = [
    "You translate IDE and terminal errors into English.",
    sourceLanguage ? `Source language: ${sourceLanguage}.` : "Language unknown.",
    `Input: ${input}`,
    "Return the translated text only.",
  ].join(" ");

  const response = await requestResponsesModel(AGENT_TRANSLATION_MODEL, AGENT_ASSIST_PROVIDER_KEY, prompt);
  return response.content;
}

export async function summarizeText(input: string) {
  const { AGENT_SUMMARY_MODEL, AGENT_ASSIST_PROVIDER_KEY } = getEnv();
  if (!AGENT_SUMMARY_MODEL || !AGENT_ASSIST_PROVIDER_KEY || !input.trim()) {
    return buildHeuristicSummary(input);
  }

  const prompt = [
    "Summarize this IDE build or runtime error in <= 2 sentences.",
    "Highlight the failing component and suspected cause.",
    `Error: ${input}`,
  ].join(" ");

  const response = await requestResponsesModel(AGENT_SUMMARY_MODEL, AGENT_ASSIST_PROVIDER_KEY, prompt);
  return response.content ?? buildHeuristicSummary(input);
}

async function requestResponsesModel(model: string, apiKey: string, input: string): Promise<LLMResponse> {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input }),
    });

    if (!response.ok) {
      console.warn("[agent/llm] provider error", response.statusText);
      return { content: null };
    }

    const data = (await response.json()) as {
      output?: Array<{ content?: Array<{ text?: { value?: string } }> }>;
    };

    const value = data.output?.[0]?.content?.[0]?.text?.value ?? null;
    return { content: value?.trim() ?? null };
  } catch (error) {
    console.warn("[agent/llm] request failed", error);
    return { content: null };
  }
}

function buildHeuristicSummary(input: string) {
  if (!input) return null;
  const lines = input.split(/\r?\n/).filter(Boolean).slice(0, 2);
  return lines.join(" ") || null;
}
