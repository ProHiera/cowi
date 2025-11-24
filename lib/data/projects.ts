import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { ComboType, Project, ProjectConfig, ProjectStatus } from "@/lib/types";

interface CreateProjectParams {
  comboType: ComboType;
  stack: string;
  promptText?: string;
}

export async function createProjectRecord({ comboType, stack, promptText }: CreateProjectParams) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      combo_type: comboType,
      stack,
      prompt_text: promptText ?? null,
      status: "prompt_ready",
      owner_id: "demo-user",
      title: `${comboType} project`,
      description: "Draft project created from combo wizard",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[projects] failed to create", error);
    throw error ?? new Error("Unable to create project");
  }

  return data satisfies Project;
}

export async function getProjectById(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_configs(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[projects] failed to fetch", error.message);
    return null;
  }

  const { project_configs, ...project } = data as Project & { project_configs: ProjectConfig | null };
  return { project, config: project_configs };
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const supabase = createSupabaseServerClient();
  return supabase.from("projects").update({ status }).eq("id", id);
}
