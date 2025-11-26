import { NextResponse } from "next/server";

import { getActiveUserId } from "@/lib/auth";
import { deleteUserModelConfig, updateUserModelConfig } from "@/lib/data/ai";
import { parseUpdateModelConfigPayload } from "@/lib/validators/model-configs";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const userId = getActiveUserId();

  try {
    const body = await request.json();
    const payload = parseUpdateModelConfigPayload(body);
    const config = await updateUserModelConfig(userId, params.id, payload);
    return NextResponse.json(config);
  } catch (error) {
    console.error("[api/model-configs/:id] failed to update", error);
    const message = error instanceof Error ? error.message : "Failed to update model config";
    const normalized = message.toLowerCase();
    const status = normalized.includes("invalid") || normalized.includes("required") ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const userId = getActiveUserId();

  try {
    await deleteUserModelConfig(userId, params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/model-configs/:id] failed to delete", error);
    const message = error instanceof Error ? error.message : "Failed to delete model config";
    return NextResponse.json({ message }, { status: 500 });
  }
}
