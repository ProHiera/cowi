import { NextResponse } from "next/server";

import { listPromptUsageLogs } from "@/lib/data/prompt-library";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam) || 20, 100) : undefined;

  try {
    const logs = await listPromptUsageLogs({ limit });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("[api/prompts/usage] failed", error);
    return NextResponse.json({ message: "Failed to load usage logs" }, { status: 500 });
  }
}
