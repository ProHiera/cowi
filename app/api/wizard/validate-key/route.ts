import { NextResponse } from "next/server";

import type { AIProvider } from "@/lib/types";

const PROVIDER_ENDPOINTS: Record<AIProvider, { url?: string; doc: string; method?: string }> = {
  cowi_free: { doc: "https://docs.cowi.dev/free-tier" },
  openai: { url: "https://api.openai.com/v1/models", doc: "https://platform.openai.com/api-keys" },
  anthropic: { url: "https://api.anthropic.com/v1/models", doc: "https://console.anthropic.com/account/keys" },
  azure_openai: { doc: "https://learn.microsoft.com/azure/ai-services/openai/how-to/create-resource" },
  google: { doc: "https://ai.google.dev/gemini-api/docs/api-key" },
  custom: { doc: "https://docs.cowi.dev/providers" },
};

async function validateAgainstProvider(provider: AIProvider, apiKey: string, baseUrl?: string) {
  if (provider === "cowi_free") {
    return { valid: true, message: "Shared Cowi free tier does not require validation." };
  }

  if (!apiKey || apiKey.length < 10) {
    return { valid: false, message: "API key looks too short." };
  }

  try {
    switch (provider) {
      case "openai": {
        const response = await fetch(baseUrl ?? PROVIDER_ENDPOINTS.openai.url!, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          cache: "no-store",
        });
        if (!response.ok) {
          const text = await response.text();
          return { valid: false, message: text || `OpenAI validation failed (${response.status})` };
        }
        return { valid: true, message: "OpenAI key validated." };
      }
      case "anthropic": {
        const response = await fetch(baseUrl ?? PROVIDER_ENDPOINTS.anthropic.url!, {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          cache: "no-store",
        });
        if (!response.ok) {
          const text = await response.text();
          return { valid: false, message: text || `Anthropic validation failed (${response.status})` };
        }
        return { valid: true, message: "Anthropic key validated." };
      }
      default: {
        if (apiKey.length >= 20) {
          return { valid: true, message: "Key format looks valid. Run a live test in the console to confirm." };
        }
        return { valid: false, message: "Key format is invalid." };
      }
    }
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : "Provider validation failed",
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const provider = body.provider as AIProvider;
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : undefined;

    if (!provider || !PROVIDER_ENDPOINTS[provider]) {
      return NextResponse.json({ message: "Unsupported provider" }, { status: 400 });
    }

    if (!apiKey && provider !== "cowi_free") {
      return NextResponse.json({ message: "API key is required" }, { status: 400 });
    }

    const result = await validateAgainstProvider(provider, apiKey, baseUrl);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/wizard/validate-key]", error);
    const message = error instanceof Error ? error.message : "Validation failed";
    return NextResponse.json({ valid: false, message }, { status: 500 });
  }
}
