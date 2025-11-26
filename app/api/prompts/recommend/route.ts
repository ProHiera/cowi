import { NextResponse } from "next/server";

import { getPromptRecommendations } from "@/lib/data/prompt-library";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const recommendations = await getPromptRecommendations({
      comboType: body.comboType ?? undefined,
      tags: Array.isArray(body.tags) ? body.tags : undefined,
      purpose: body.purpose ?? undefined,
      limit: body.limit ?? undefined,
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("[api/prompts/recommend] failed", error);
    return NextResponse.json({ message: "Failed to compute recommendations" }, { status: 500 });
  }
}
