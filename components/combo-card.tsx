"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ComboPreset } from "@/lib/types";

interface Props {
  preset: ComboPreset;
}

export function ComboCard({ preset }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSelect() {
    startTransition(async () => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comboType: preset.id, stack: preset.defaultStack }),
      });
      if (!response.ok) {
        console.error("Failed to create project", await response.text());
        return;
      }
      const data = await response.json();
      router.push(`/studio?projectId=${data.id}&combo=${preset.id}`);
    });
  }

  return (
    <Card className="flex flex-col border-border/70">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{preset.name}</CardTitle>
          <Badge variant="outline" className="capitalize">
            {preset.difficulty}
          </Badge>
        </div>
        <CardDescription>{preset.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {preset.tools.map((tool) => (
            <Badge key={tool} variant="secondary">
              {tool}
            </Badge>
          ))}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommended deployment tools</p>
          <Tabs defaultValue={preset.recommendations[0]?.target ?? "vercel"} className="mt-2">
            <TabsList>
              {preset.recommendations.map((rec) => (
                <TabsTrigger key={rec.target} value={rec.target} className="capitalize">
                  {rec.target.replace("concept_", "")}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Target: <span className="font-medium capitalize">{preset.target}</span>
        </div>
        <Button onClick={handleSelect} disabled={pending}>
          Start with this combo
        </Button>
      </CardFooter>
    </Card>
  );
}
