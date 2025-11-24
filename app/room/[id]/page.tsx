import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomView } from "@/components/room-view";
import { getRoomById } from "@/lib/data/rooms";
import type { RoomParticipant } from "@/lib/types";

interface RoomPageProps {
  params: { id: string };
}

export default async function RoomPage({ params }: RoomPageProps) {
  const room = await getRoomById(params.id);

  if (!room) {
    notFound();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <RoomView
        roomId={room.id}
        roomName={room.name}
        initialPrompt={room.room_states?.current_prompt_text ?? ""}
        initialCombo={room.room_states?.selected_combo_type ?? "web"}
      />
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>Mocked list for now, wire Supabase Auth soon.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {(room.room_participants ?? []).map((participant: RoomParticipant) => (
            <div key={participant.id} className="flex items-center justify-between rounded border p-2">
              <span>{participant.user_id}</span>
              <span className="text-muted-foreground">active</span>
            </div>
          ))}
          {(room.room_participants?.length ?? 0) === 0 && (
            <p className="text-muted-foreground">No participants yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
