import { NextResponse } from "next/server";

import { updateOnboardingSession } from "@/lib/data/onboarding";

interface RouteParams {
  params: { id: string };
}

const ALLOWED_FIELDS = new Set([
  "purpose",
  "target_audience",
  "model_preference",
  "hosting_target",
  "api_provider",
  "api_key_last_four",
  "recommend_template_id",
  "metadata",
]);

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const payload: Record<string, unknown> = {};

    Object.keys(body ?? {}).forEach((key) => {
      if (ALLOWED_FIELDS.has(key)) {
        payload[key] = body[key];
      }
    });

    if (!Object.keys(payload).length) {
      return NextResponse.json({ message: "No valid fields provided" }, { status: 400 });
    }

    const session = await updateOnboardingSession(params.id, payload);
    return NextResponse.json(session);
  } catch (error) {
    console.error("[api/wizard/session] update failed", error);
    const message = error instanceof Error ? error.message : "Failed to update session";
    return NextResponse.json({ message }, { status: 500 });
  }
}
