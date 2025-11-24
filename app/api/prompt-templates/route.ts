import { NextResponse } from "next/server";

import { listPromptTemplates } from "@/lib/data/prompt-templates";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag") ?? undefined;
  const templates = await listPromptTemplates(tag ?? undefined);

  return NextResponse.json(templates);
}
