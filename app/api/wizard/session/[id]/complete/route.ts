import { NextResponse } from "next/server";

import { finalizeOnboardingSession } from "@/lib/data/onboarding";
import type { ComboType } from "@/lib/types";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { comboType, stack, projectTitle, promptText, recommendTemplateId, metadata } = body;

    if (!comboType || !stack || !projectTitle) {
      return NextResponse.json({ message: "comboType, stack, and projectTitle are required" }, { status: 400 });
    }

    const project = await finalizeOnboardingSession({
      sessionId: params.id,
      comboType: comboType as ComboType,
      stack,
      projectTitle,
      promptText,
      recommendTemplateId,
      metadata,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("[api/wizard/complete] failed", error);
    const message = error instanceof Error ? error.message : "Failed to complete wizard";
    return NextResponse.json({ message }, { status: 500 });
  }
}
