import { notFound } from "next/navigation";

import { DeploymentForm } from "@/components/deployment-form";
import { DomainSearchPanel } from "@/components/domain-search-panel";
import { ModelConfigManager } from "@/components/model-config-manager";
import { ProjectAISettingsCard } from "@/components/project-ai-settings-card";
import { StatusTimeline } from "@/components/status-timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getProjectById } from "@/lib/data/projects";

interface ProjectPageProps {
  params: { id: string };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const payload = await getProjectById(params.id);
  if (!payload) {
    notFound();
  }

  const { project, config } = payload;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <CardDescription>
            {project.combo_type} · stack {project.stack}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusTimeline currentStatus={project.status} />
          <Separator />
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Prompt</p>
              <p className="font-semibold">{project.prompt_text ?? "No prompt yet"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Deployment target</p>
              <p className="font-semibold">{config?.deployment_target ?? "vercel"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Status</p>
              <p className="font-semibold capitalize">{project.status.replace("_", " ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Deployment setup</CardTitle>
            <CardDescription>
              Configure repository and build information. Later we will call Vercel Deploy Hooks here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeploymentForm
              projectId={project.id}
              initialValues={{
                repoUrl: config?.repo_url ?? "",
                buildCommand: config?.build_command ?? "npm run build",
                outputDir: config?.output_dir ?? ".next",
                deploymentTarget: config?.deployment_target ?? "vercel",
              }}
            />
            {/* TODO integrate Supabase action for project configs when server actions land */}
          </CardContent>
        </Card>
        <DomainSearchPanel />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ProjectAISettingsCard projectId={project.id} />
        <ModelConfigManager />
      </div>
    </div>
  );
}
