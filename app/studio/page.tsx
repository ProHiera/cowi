import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PromptStudioPanel } from "@/components/prompt-studio-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listPromptTemplates } from "@/lib/data/prompt-templates";
import { getProjectById } from "@/lib/data/projects";

interface StudioPageProps {
  searchParams: { projectId?: string; combo?: string };
}

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const projectId = searchParams.projectId;
  const combo = searchParams.combo;

  if (!projectId) {
    redirect("/?missingProject=true");
  }

  const projectPayload = await getProjectById(projectId);
  const templates = await listPromptTemplates(combo);

  if (!projectPayload) {
    redirect("/?missingProject=true");
  }

  const { project } = projectPayload;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Suspense fallback={<CardSkeleton />}>
        <PromptStudioPanel
          projectId={project.id}
          initialPrompt={project.prompt_text ?? ""}
          templates={templates}
          combo={combo ?? project.combo_type}
        />
      </Suspense>
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Prompt helper</CardTitle>
          <CardDescription>Auto-generate prompts from simple inputs (coming soon).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>We will plug an AI model here. For now, rely on prompt templates or manual editing.</p>
          <ul className="list-disc space-y-1 pl-4">
            <li>Describe the product mission and target persona.</li>
            <li>List the deployment surface, e.g., web app, marketing site, mobile shell.</li>
            <li>Specify budgets or compliance requirements for better tool matches.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="animate-pulse">Loading project...</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-8 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-32 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}
