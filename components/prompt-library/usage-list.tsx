import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PromptUsageLog } from "@/lib/types";

interface UsageListProps {
  logs: PromptUsageLog[];
}

export function UsageList({ logs }: UsageListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent usage</CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No usage recorded yet.</p>
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="rounded border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{log.combo_type ?? "n/a"}</Badge>
                    <Badge variant="secondary">{log.provider ?? "unknown"}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Tokens in: {log.tokens_input ?? 0}</span>
                    <span>Tokens out: {log.tokens_output ?? 0}</span>
                    <span>Cost: ${log.cost_usd?.toFixed(4) ?? "0.0000"}</span>
                  </div>
                  {getSourceLabel(log.metadata) && (
                    <p className="mt-1 text-xs text-muted-foreground">Source: {getSourceLabel(log.metadata)}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function getSourceLabel(metadata: Record<string, unknown> | null) {
  if (!metadata) return null;
  const value = metadata["source"];
  return typeof value === "string" ? value : null;
}
