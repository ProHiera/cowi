import { Suspense } from "react";

import { AgentEventsList } from "@/components/agent/events-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAgentEvents } from "@/lib/agent/events";

export const metadata = {
  title: "VSCode Agent",
};

export default async function AgentPage() {
  const [readyEvents, recentEvents] = await Promise.all([
    listAgentEvents({ limit: 10, status: "ready" }),
    listAgentEvents({ limit: 20 }),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">VSCode Agent</h1>
        <p className="text-sm text-muted-foreground">
          Stream IDE errors, translate non-English logs, and approve safe patches that sync back to your repo.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard label="Actionable" value={readyEvents.length} hint="Waiting for approval" />
        <StatusCard label="Recently Applied" value={recentEvents.filter((event) => event.status === "applied").length} hint="Auto fixes committed" />
        <StatusCard label="Total Events" value={recentEvents.length} hint="Last 20 ingested" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Suspense fallback={<div>Loading action items...</div>}>
          {/* Client component handles live polling */}
          <AgentEventsList status="ready" initialEvents={readyEvents} title="Requires attention" />
        </Suspense>
        <Suspense fallback={<div>Loading stream...</div>}>
          <AgentEventsList initialEvents={recentEvents} title="Recent activity" />
        </Suspense>
      </div>
    </div>
  );
}

function StatusCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
