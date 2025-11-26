import { NextResponse } from "next/server";

import { getPromptEntryById, logPromptUsage } from "@/lib/data/prompt-library";
import { updateProjectPrompt } from "@/lib/data/projects";
import { getEnv } from "@/lib/env";
import { triggerDeployHook, type DeployHookOutcome } from "@/lib/deploy";
import type { AIProvider, ComboType } from "@/lib/types";

interface ApplyPayload {
  promptId?: string;
  projectId?: string;
  comboType?: ComboType;
  provider?: AIProvider;
  tokensInput?: number;
  tokensOutput?: number;
  costUsd?: number;
  metadata?: Record<string, unknown>;
  deploy?: boolean;
  deployHookOverride?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplyPayload;
    if (!body.promptId) {
      return NextResponse.json({ message: "promptId is required" }, { status: 400 });
    }

    const prompt = await getPromptEntryById(body.promptId);
    if (!prompt) {
      return NextResponse.json({ message: "Prompt not found" }, { status: 404 });
    }

    let projectUpdate = null;
    let deployOutcome: DeployHookOutcome | null = null;
    if (body.projectId) {
      projectUpdate = await updateProjectPrompt(body.projectId, prompt.content);
    }

    const shouldDeploy = Boolean(body.deploy && body.projectId);
    if (shouldDeploy) {
      const hookCandidate = pickDeployHook(body.deployHookOverride, prompt.metadata);
      deployOutcome = await triggerDeployHook(hookCandidate ?? getEnv().VERCEL_DEPLOY_HOOK_URL ?? null);
    }

    await logPromptUsage({
      promptId: body.promptId,
      projectId: body.projectId,
      comboType: body.comboType ?? (prompt.combo_type === "all" ? undefined : prompt.combo_type),
      provider: body.provider,
      tokensInput: body.tokensInput,
      tokensOutput: body.tokensOutput,
      costUsd: body.costUsd,
      metadata: {
        ...(body.metadata ?? {}),
        source: "api_prompts_apply",
        deploy_triggered_at: deployOutcome?.deployTriggeredAt ?? null,
        deploy_status: deployOutcome?.deployResponse?.ok ?? null,
      },
    });

    return NextResponse.json({ prompt, project: projectUpdate, deploy: deployOutcome });
  } catch (error) {
    console.error("[api/prompts/apply] failed", error);
    const message = error instanceof Error ? error.message : "Failed to apply prompt";
    return NextResponse.json({ message }, { status: 500 });
  }
}

function pickDeployHook(
  override?: string,
  metadata?: Record<string, unknown> | null
): string | null {
  if (override && override.trim().length > 0) {
    return override.trim();
  }

  if (metadata && typeof metadata === "object") {
    const candidate = metadata["vercelHookOverride"];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}
