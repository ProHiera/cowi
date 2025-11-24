import { NextResponse } from "next/server";

import { createProjectRecord } from "@/lib/data/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { comboType, stack, promptText } = body;

  if (!comboType || !stack) {
    return NextResponse.json({ message: "comboType and stack are required" }, { status: 400 });
  }

  try {
    const project = await createProjectRecord({ comboType, stack, promptText });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[api/projects] POST failed", error);
    return NextResponse.json({ message: "Failed to create project" }, { status: 500 });
  }
}
