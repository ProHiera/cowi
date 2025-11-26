import Link from "next/link";
import type { Metadata } from "next";

import { MetricsGrid } from "@/components/console/metrics-grid";
import { OnboardingTable } from "@/components/console/onboarding-table";
import { ProjectsTimeline } from "@/components/console/projects-timeline";
import { DeployLogCard } from "@/components/console/deploy-log-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getConsoleSummary } from "@/lib/data/console";

export const metadata: Metadata = {
  title: "Operations Console",
};

export default async function ConsolePage() {
  const summary = await getConsoleSummary();

  const onboardingMetrics = [
    { label: "Draft sessions", value: summary.onboardingTotals.draft ?? 0 },
    { label: "Completed", value: summary.onboardingTotals.completed ?? 0 },
    { label: "Failed", value: summary.onboardingTotals.failed ?? 0 },
  ];

  const projectMetrics = [
    { label: "Prompt ready", value: summary.projectTotals.prompt_ready ?? 0 },
    { label: "Code generated", value: summary.projectTotals.code_generated ?? 0 },
    { label: "Deploy configured", value: summary.projectTotals.deploy_configured ?? 0 },
    { label: "Domain ready", value: summary.projectTotals.domain_ready ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Operations Console</h1>
          <p className="text-sm text-muted-foreground">
            온보딩 설문부터 배포 트리거까지 전 과정을 한 번에 모니터링하세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/wizard">New onboarding</Link>
          </Button>
          <Button asChild>
            <Link href="/studio">Open studio</Link>
          </Button>
        </div>
      </div>

      <MetricsGrid
        sections={[
          { title: "Onboarding pipeline", metrics: onboardingMetrics },
          { title: "Project stages", metrics: projectMetrics },
        ]}
      />

      <Separator />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest onboarding sessions</h2>
            <span className="text-xs text-muted-foreground">
              Updated {new Date(summary.generatedAt).toLocaleString()}
            </span>
          </div>
          <OnboardingTable sessions={summary.recentOnboarding} />
        </div>
        <DeployLogCard entries={summary.deployLog} />
      </div>

      <ProjectsTimeline projects={summary.recentProjects} />
    </div>
  );
}
