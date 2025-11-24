"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PromptEditor } from "@/components/prompt-editor";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseBrowserClient } from "@/lib/supabase/browser-client";

interface RoomViewProps {
  roomId: string;
  initialPrompt: string;
  initialCombo: string;
  roomName: string;
}

export function RoomView({ roomId, initialPrompt, initialCombo, roomName }: RoomViewProps) {
  const supabase = useSupabaseBrowserClient();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [combo, setCombo] = useState(initialCombo);
  const [editorActive, setEditorActive] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on("broadcast", { event: "prompt_update" }, ({ payload }) => {
        setPrompt(payload.text);
      })
      .on("broadcast", { event: "combo_update" }, ({ payload }) => {
        setCombo(payload.comboType);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, supabase]);

  const initials = useMemo(() => roomName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), [roomName]);

  async function broadcastPrompt(next: string) {
    setPrompt(next);
    setEditorActive(true);
    await channelRef.current?.send({ type: "broadcast", event: "prompt_update", payload: { text: next } });
    setTimeout(() => setEditorActive(false), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{roomName}</CardTitle>
            <CardDescription>Realtime room powered by Supabase</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{combo}</p>
              <p className="text-xs text-muted-foreground">Room #{roomId.slice(0, 6)}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <PromptEditor value={prompt} onChange={broadcastPrompt} isBroadcasting={editorActive} />
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">Supabase Realtime</Badge>
          <Button size="sm" variant="outline" onClick={() => channelRef.current?.send({ type: "broadcast", event: "combo_update", payload: { comboType: combo } })}>
            Sync combo to project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
