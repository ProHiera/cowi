import { CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeployLogEntry } from "@/lib/types";

interface DeployLogCardProps {
  entries: DeployLogEntry[];
}

export function DeployLogCard({ entries }: DeployLogCardProps) {
  if (!entries.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Deploy hook activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No deploy hook activity yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Deploy hook activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map((entry) => (
          <div key={`${entry.sessionId}-${entry.triggeredAt ?? "pending"}`} className="space-y-1">
            <div className="flex items-center gap-2">
              {renderStatusIcon(entry)}
              <span className="text-sm font-medium">
                Session {entry.sessionId.slice(0, 8)}…
              </span>
              <Badge variant="outline">{entry.statusCode ?? "—"}</Badge>
              <span className="text-xs text-muted-foreground">
                {entry.triggeredAt ? new Date(entry.triggeredAt).toLocaleString() : "Pending"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {entry.errorMessage ?? entry.bodyPreview ?? "Awaiting response"}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function renderStatusIcon(entry: DeployLogEntry) {
  if (entry.ok === true) {
    return <CheckCircle2Icon className="size-4 text-emerald-500" />;
  }

  if (entry.ok === false) {
    return <XCircleIcon className="size-4 text-destructive" />;
  }

  return <ClockIcon className="size-4 text-muted-foreground" />;
}
