import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function getRoomById(id: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_states(*), room_participants(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[rooms] fetch error", error.message);
    return null;
  }

  return data;
}
