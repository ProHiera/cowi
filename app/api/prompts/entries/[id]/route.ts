import { NextResponse } from "next/server";

import { deletePromptEntry, updatePromptEntry } from "@/lib/data/prompt-library";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const entry = await updatePromptEntry(params.id, {
      title: body.title,
      summary: body.summary,
      content: body.content,
      comboType: body.comboType,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      metadata: body.metadata,
      isShared: typeof body.isShared === "boolean" ? body.isShared : undefined,
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("[api/prompts/entries/:id] update failed", error);
    const message = error instanceof Error ? error.message : "Failed to update prompt";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await deletePromptEntry(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/prompts/entries/:id] delete failed", error);
    const message = error instanceof Error ? error.message : "Failed to delete prompt";
    return NextResponse.json({ message }, { status: 500 });
  }
}
