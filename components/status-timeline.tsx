import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { ProjectStatus } from "@/lib/types";

interface StatusTimelineProps {
  currentStatus: ProjectStatus;
}

const STATUS_ORDER: ProjectStatus[] = [
  "prompt_ready",
  "code_generated",
  "deploy_configured",
  "domain_ready",
];

export function StatusTimeline({ currentStatus }: StatusTimelineProps) {
  return (
    <ol className="flex flex-col gap-4 md:flex-row md:items-center">
      {STATUS_ORDER.map((status, index) => {
        const isComplete = STATUS_ORDER.indexOf(currentStatus) >= index;
        return (
          <li key={status} className="flex items-center gap-3">
            <Badge variant={isComplete ? "default" : "secondary"}>
              {PROJECT_STATUS_LABELS[status]}
            </Badge>
            {index < STATUS_ORDER.length - 1 && (
              <Separator orientation="horizontal" className="hidden w-16 md:flex" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
