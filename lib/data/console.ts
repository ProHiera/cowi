import { getActiveUserId } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import type {
  ConsoleProjectRow,
  ConsoleSummary,
  DeployLogEntry,
  OnboardingSession,
  OnboardingStatus,
  Project,
  ProjectConfig,
  ProjectStatus,
} from "@/lib/types";

const ONBOARDING_LIMIT = 10;
const PROJECT_LIMIT = 10;
const DEPLOY_LOG_LIMIT = 15;

type ProjectRow = Project & { project_configs: ProjectConfig | null };

type StatusCounter<T extends string> = Partial<Record<T, number>>;

export async function getConsoleSummary(): Promise<ConsoleSummary> {
  const supabase = createSupabaseServerClient();
  const userId = getActiveUserId();

  const [sessionsResult, projectsResult] = await Promise.all([
    supabase
      .from("onboarding_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(ONBOARDING_LIMIT),
    supabase
      .from("projects")
      .select("*, project_configs(*)")
      .eq("owner_id", userId)
      .order("updated_at", { ascending: false })
      .limit(PROJECT_LIMIT),
  ]);

  if (sessionsResult.error) {
    console.error("[console] failed to load onboarding sessions", sessionsResult.error.message);
  }

  if (projectsResult.error) {
    console.error("[console] failed to load projects", projectsResult.error.message);
  }

  const sessions = (sessionsResult.data ?? []) as OnboardingSession[];
  const projectRows = (projectsResult.data ?? []).map((row) => row as unknown as ProjectRow);
  const recentProjects: ConsoleProjectRow[] = projectRows.map((row) => {
    const { project_configs, ...project } = row;
    return { project, config: project_configs };
  });

  const onboardingTotals = accumulateStatusCounts<OnboardingStatus>(sessions.map((s) => s.status));
  const projectTotals = accumulateStatusCounts<ProjectStatus>(recentProjects.map(({ project }) => project.status));

  const deployLog = sessions
    .filter((session) => session.deploy_triggered_at || session.deploy_response)
    .slice(0, DEPLOY_LOG_LIMIT)
    .map(toDeployLogEntry);

  return {
    onboardingTotals,
    projectTotals,
    recentOnboarding: sessions,
    recentProjects,
    deployLog,
    generatedAt: new Date().toISOString(),
  };
}

function accumulateStatusCounts<T extends string>(statuses: T[]): StatusCounter<T> {
  return statuses.reduce<StatusCounter<T>>((acc, status) => {
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
}

function toDeployLogEntry(session: OnboardingSession): DeployLogEntry {
  const response = (session.deploy_response ?? {}) as Record<string, unknown>;
  const ok = typeof response["ok"] === "boolean" ? (response["ok"] as boolean) : null;

  let statusCode: number | null = null;
  if (typeof response["status"] === "number") {
    statusCode = response["status"] as number;
  } else if (typeof response["status"] === "string") {
    const parsed = Number(response["status"]);
    statusCode = Number.isFinite(parsed) ? parsed : null;
  }

  const bodyPreview =
    typeof response["body"] === "string" ? (response["body"] as string).slice(0, 200) : null;
  const errorMessage = typeof response["error"] === "string" ? (response["error"] as string) : null;

  return {
    sessionId: session.id,
    hookUrl: session.vercel_hook_url,
    triggeredAt: session.deploy_triggered_at,
    ok,
    statusCode,
    bodyPreview,
    errorMessage,
  };
}
