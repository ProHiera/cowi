import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AgentEvent } from "@/lib/types";

interface AgentEventCardProps {
  event: AgentEvent;
  onApply?: (event: AgentEvent) => Promise<void>;
  onReject?: (event: AgentEvent) => Promise<void>;
}

export function AgentEventCard({ event, onApply, onReject }: AgentEventCardProps) {
  const isActionable = Boolean(event.fix_patch && onApply);
  const statusBadge = statusVariant(event.status);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={statusBadge}>{event.status}</Badge>
          <Badge variant="outline">{event.event_type}</Badge>
        </div>
        <CardTitle className="text-base">{event.summary ?? getPayloadString(event.payload) ?? "Untitled event"}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date(event.created_at).toLocaleString()} · {event.source.toUpperCase()} · {event.file_path ?? "Unknown file"}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {event.translated_text && event.detected_language && event.detected_language !== "en" && (
          <div>
            <p className="font-semibold">Translated log</p>
            <p className="text-muted-foreground whitespace-pre-wrap">{event.translated_text}</p>
          </div>
        )}
        <div>
          <p className="font-semibold">Hypotheses</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {event.root_cause?.map((entry) => (
              <li key={entry.title}>
                <span className="font-medium text-foreground">{entry.title}</span>: {entry.detail}
              </li>
            )) ?? <li>No root cause yet</li>}
          </ul>
        </div>
        {event.fix_patch && (
          <div>
            <p className="font-semibold">Suggested diff</p>
            <Separator className="my-2" />
            <pre className="rounded bg-muted p-3 text-xs overflow-auto">
              <code>{event.fix_patch}</code>
            </pre>
          </div>
        )}
      </CardContent>
      {isActionable && onApply && onReject && (
        <CardFooter className="gap-2">
          <Button size="sm" onClick={() => onApply(event)}>
            Apply & Commit
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onReject(event)}>
            Dismiss
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function statusVariant(status: AgentEvent["status"]) {
  switch (status) {
    case "ready":
      return "default";
    case "processing":
      return "secondary";
    case "applied":
      return "outline";
    case "error":
      return "destructive";
    default:
      return "secondary";
  }
}

function getPayloadString(payload: AgentEvent["payload"]) {
  if (!payload) return null;
  const candidates = ["message", "text", "stderr", "stdout"];
  for (const key of candidates) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}
