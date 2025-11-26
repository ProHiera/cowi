import { NextResponse } from "next/server";

import { retriggerOnboardingDeploy } from "@/lib/data/onboarding";

interface RouteParams {
  params: { id: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await readBody(request);
    const hookUrl = typeof body.hookUrl === "string" ? body.hookUrl : undefined;
    const session = await retriggerOnboardingDeploy(params.id, hookUrl);
    return NextResponse.json(session);
  } catch (error) {
    console.error("[api/console/deploy] failed", error);
    const message = error instanceof Error ? error.message : "Failed to retrigger deploy";
    return NextResponse.json({ message }, { status: 500 });
  }
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) ?? {};
  } catch {
    return {};
  }
}
