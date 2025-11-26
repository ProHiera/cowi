import { getActiveUserId } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type { ComboType, Project, ProjectConfig, ProjectStatus } from "@/lib/types";

interface CreateProjectParams {
  comboType: ComboType;
  stack: string;
  promptText?: string;
  title?: string;
  description?: string;
  status?: ProjectStatus;
}

export async function createProjectRecord({
  comboType,
  stack,
  promptText,
  title,
  description,
  status,
}: CreateProjectParams) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      combo_type: comboType,
      stack,
      prompt_text: promptText ?? null,
      status: status ?? "prompt_ready",
      owner_id: getActiveUserId(),
      title: title ?? `${comboType} project`,
      description: description ?? "Draft project created from combo wizard",
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[projects] failed to create", error);
    throw error ?? new Error("Unable to create project");
  }

  return data as Project;
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

  const typed = data as unknown as Project & { project_configs: ProjectConfig | null };
  const { project_configs, ...project } = typed;
  return { project, config: project_configs };
}

export async function updateProjectStatus(id: string, status: ProjectStatus) {
  const supabase = createSupabaseServerClient();
  return supabase.from("projects").update({ status }).eq("id", id);
}

export async function updateProjectPrompt(id: string, promptText: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ prompt_text: promptText })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[projects] failed to update prompt", error?.message);
    throw error ?? new Error("Unable to update project prompt");
  }

  return data as Project;
}
