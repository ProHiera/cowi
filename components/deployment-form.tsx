"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DeploymentTarget } from "@/lib/types";

export interface DeploymentFormValues {
  repoUrl: string;
  buildCommand: string;
  outputDir: string;
  deploymentTarget: DeploymentTarget;
}

interface DeploymentFormProps {
  initialValues?: Partial<DeploymentFormValues>;
  onSubmit?: (values: DeploymentFormValues) => Promise<void> | void;
  projectId?: string;
}

const DEFAULT_VALUES: DeploymentFormValues = {
  repoUrl: "https://github.com/acme/new-app",
  buildCommand: "npm run build",
  outputDir: ".next",
  deploymentTarget: "vercel",
};

export function DeploymentForm({ initialValues, onSubmit, projectId }: DeploymentFormProps) {
  const [values, setValues] = useState({ ...DEFAULT_VALUES, ...initialValues });
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    await onSubmit?.(values);

    if (projectId) {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            repo_url: values.repoUrl,
            build_command: values.buildCommand,
            output_dir: values.outputDir,
            env_config: null,
            deployment_target: values.deploymentTarget,
          },
          status: "deploy_configured",
        }),
      });
    }
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="repo-url">Repository URL</Label>
        <Input
          id="repo-url"
          value={values.repoUrl}
          onChange={(event) => setValues((curr) => ({ ...curr, repoUrl: event.target.value }))}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="build-command">Build command</Label>
          <Input
            id="build-command"
            value={values.buildCommand}
            onChange={(event) => setValues((curr) => ({ ...curr, buildCommand: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="output-dir">Output directory</Label>
          <Input
            id="output-dir"
            value={values.outputDir}
            onChange={(event) => setValues((curr) => ({ ...curr, outputDir: event.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Deployment target</Label>
        <Select
          value={values.deploymentTarget}
          onValueChange={(next: DeploymentTarget) => setValues((curr) => ({ ...curr, deploymentTarget: next }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vercel">Vercel (recommended)</SelectItem>
            <SelectItem value="concept_aws">Concept AWS</SelectItem>
            <SelectItem value="concept_netlify">Concept Netlify</SelectItem>
            <SelectItem value="concept_expo">Concept Expo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save deployment config"}
      </Button>
    </form>
  );
}
