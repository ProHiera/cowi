interface DeployHookOutcome {
  deployTriggeredAt: string | null;
  deployResponse: Record<string, unknown> | null;
}

export async function triggerDeployHook(hookUrl: string | null): Promise<DeployHookOutcome> {
  if (!hookUrl) {
    return { deployTriggeredAt: null, deployResponse: null };
  }

  try {
    const res = await fetch(hookUrl, { method: "POST" });
    const bodyText = await res.text();
    return {
      deployTriggeredAt: new Date().toISOString(),
      deployResponse: {
        status: res.status,
        ok: res.ok,
        body: bodyText.slice(0, 2000),
      },
    };
  } catch (error) {
    return {
      deployTriggeredAt: new Date().toISOString(),
      deployResponse: {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export type { DeployHookOutcome };
