import { NextResponse } from "next/server";

import { getConsoleSummary } from "@/lib/data/console";

export async function GET() {
  try {
    const summary = await getConsoleSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[api/console/summary] failed", error);
    return NextResponse.json({ message: "Failed to load console data" }, { status: 500 });
  }
}
