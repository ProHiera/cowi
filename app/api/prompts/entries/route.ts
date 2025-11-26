import { NextResponse } from "next/server";

import { createPromptEntry, listPromptLibraryEntries } from "@/lib/data/prompt-library";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeShared = searchParams.get("shared") === "1";
  const tag = searchParams.get("tag") ?? undefined;
  const query = searchParams.get("q") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam) || 50, 200) : undefined;

  try {
    const entries = await listPromptLibraryEntries({
      includeShared,
      tag,
      query,
      limit,
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error("[api/prompts/entries] list failed", error);
    return NextResponse.json({ message: "Failed to list prompts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.content) {
      return NextResponse.json({ message: "title and content are required" }, { status: 400 });
    }

    const entry = await createPromptEntry({
      title: body.title,
      content: body.content,
      summary: body.summary ?? null,
      comboType: body.comboType,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      metadata: body.metadata ?? null,
      isShared: Boolean(body.isShared),
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("[api/prompts/entries] create failed", error);
    const message = error instanceof Error ? error.message : "Failed to create prompt";
    return NextResponse.json({ message }, { status: 500 });
  }
}
