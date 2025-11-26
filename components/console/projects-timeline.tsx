import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { ConsoleProjectRow } from "@/lib/types";

interface ProjectsTimelineProps {
  projects: ConsoleProjectRow[];
}

export function ProjectsTimeline({ projects }: ProjectsTimelineProps) {
  if (!projects.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent projects</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            아직 생성된 프로젝트가 없습니다. 온보딩을 완료하면 자동으로 생성됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Recent projects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {projects.map(({ project }, index) => (
          <div key={project.id} className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-semibold">{project.title}</h4>
              <Badge variant="outline">{project.combo_type}</Badge>
              <Badge variant="secondary">{project.stack}</Badge>
              <Badge variant="default">
                {PROJECT_STATUS_LABELS[project.status] ?? project.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{project.description ?? "설명 없음"}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Updated {new Date(project.updated_at).toLocaleString()}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Created {new Date(project.created_at).toLocaleString()}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/project/${project.id}`} className="inline-flex items-center gap-1">
                  Open
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/room">Rooms</Link>
              </Button>
            </div>
            {index < projects.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
