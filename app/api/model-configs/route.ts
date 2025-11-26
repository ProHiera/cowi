import { NextResponse } from "next/server";

import { getActiveUserId } from "@/lib/auth";
import { createUserModelConfig, listUserModelConfigs } from "@/lib/data/ai";
import { parseCreateModelConfigPayload } from "@/lib/validators/model-configs";

export async function GET() {
  const userId = getActiveUserId();
  const configs = await listUserModelConfigs(userId);
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const userId = getActiveUserId();

  try {
    const body = await request.json();
    const payload = parseCreateModelConfigPayload(body);
    const config = await createUserModelConfig(userId, payload);
    return NextResponse.json(config, { status: 201 });
  } catch (error) {
    console.error("[api/model-configs] failed to create", error);
    const message = error instanceof Error ? error.message : "Failed to create model config";
    const normalized = message.toLowerCase();
    const status = normalized.includes("invalid") || normalized.includes("required") ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
