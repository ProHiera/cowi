import { FALLBACK_PROMPTS } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function listPromptTemplates(tag?: string) {
  const supabase = createSupabaseServerClient();
  let query = supabase.from("prompt_templates").select("*").order("created_at", { ascending: false });

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query;
  if (error || !data?.length) {
    if (error) {
      console.error("[prompt_templates] list error", error.message);
    }
    return FALLBACK_PROMPTS;
  }

  return data;
}
