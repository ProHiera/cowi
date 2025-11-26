"use client";

import useSWR from "swr";

import { AgentEventCard } from "@/components/agent/event-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentEvent } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((response) => response.json());

interface AgentEventsListProps {
  status?: AgentEvent["status"];
  initialEvents?: AgentEvent[];
  title?: string;
}

export function AgentEventsList({ status, initialEvents, title }: AgentEventsListProps) {
  const query = status ? `?status=${status}` : "";
  const {
    data,
    isLoading,
    mutate,
  } = useSWR<AgentEvent[]>(`/api/agent/events${query}`, fetcher, {
    refreshInterval: 30_000,
    fallbackData: initialEvents,
  });

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!data?.length) {
    return (
      <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
        <p>No agent events yet.</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => mutate()}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>}
      {data.map((event: AgentEvent) => (
        <AgentEventCard
          key={event.id}
          event={event}
          onApply={() => handleApply(event, mutate)}
          onReject={() => handleReject(event, mutate)}
        />
      ))}
    </div>
  );
}

async function handleApply(event: AgentEvent, mutate: () => void) {
  await fetch(`/api/agent/events/${event.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "applied", fixStatus: "applied" }),
  });
  mutate();
}

async function handleReject(event: AgentEvent, mutate: () => void) {
  await fetch(`/api/agent/events/${event.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ready", fixStatus: "rejected" }),
  });
  mutate();
}
