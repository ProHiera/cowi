import { NextResponse } from "next/server";

import { getProjectById, updateProjectStatus } from "@/lib/data/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const project = await getProjectById(params.id);
  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(request: Request, { params }: Params) {
  const payload = await request.json();
  const supabase = createSupabaseServerClient();

  if (payload.status) {
    await updateProjectStatus(params.id, payload.status);
  }

   if (typeof payload.prompt_text === "string") {
    await supabase
      .from("projects")
      .update({ prompt_text: payload.prompt_text })
      .eq("id", params.id);
  }

  if (payload.config) {
    const { repo_url, build_command, output_dir, env_config, deployment_target } = payload.config;
    await supabase
      .from("project_configs")
      .upsert({
        project_id: params.id,
        repo_url,
        build_command,
        output_dir,
        env_config,
        deployment_target,
      });
  }

  return NextResponse.json({ success: true });
}
