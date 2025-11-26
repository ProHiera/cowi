"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OnboardingSession } from "@/lib/types";

interface OnboardingTableProps {
  sessions: OnboardingSession[];
}

export function OnboardingTable({ sessions }: OnboardingTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRetry = async (sessionId: string) => {
    setPendingId(sessionId);
    try {
      const response = await fetch(`/api/console/deploy/${sessionId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Deploy hook failed");
      }

      toast.success("Deploy hook triggered");
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to trigger deploy");
    } finally {
      setPendingId(null);
    }
  };

  if (!sessions.length) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        아직 완료된 온보딩 세션이 없습니다. 설문 마법사를 완료하면 자동으로 기록됩니다.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Purpose</TableHead>
            <TableHead>Audience</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deploy</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => {
            const deployState = resolveDeployState(session);
            const isLoading = pendingId === session.id && isPending;
            return (
              <TableRow key={session.id}>
                <TableCell>
                  <p className="font-medium">{session.purpose ?? "(untitled)"}</p>
                  <p className="text-xs text-muted-foreground">
                    Template: {session.recommend_template_id ?? "—"}
                  </p>
                </TableCell>
                <TableCell>
                  <p>{session.target_audience ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{session.api_provider ?? "n/a"}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[session.status] ?? "secondary"}>
                    {STATUS_LABELS[session.status] ?? session.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={deployState.variant}>{deployState.label}</Badge>
                    {session.deploy_triggered_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.deploy_triggered_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => handleRetry(session.id)}
                  >
                    {isLoading ? "Triggering…" : "Retry deploy"}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const STATUS_LABELS = {
  draft: "Draft",
  completed: "Completed",
  failed: "Failed",
} satisfies Record<string, string>;

const STATUS_VARIANTS = {
  draft: "secondary",
  completed: "default",
  failed: "destructive",
} as const;

function resolveDeployState(session: OnboardingSession) {
  if (!session.deploy_triggered_at && !session.deploy_response) {
    return { label: "Not triggered", variant: "secondary" as const };
  }

  const response = (session.deploy_response ?? {}) as Record<string, unknown>;
  if (typeof response["ok"] === "boolean") {
    return response["ok"]
      ? { label: "Success", variant: "default" as const }
      : { label: "Failed", variant: "destructive" as const };
  }

  return { label: "Triggered", variant: "outline" as const };
}
