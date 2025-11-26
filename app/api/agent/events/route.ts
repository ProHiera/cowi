import { createHmac } from "crypto";
import { NextResponse } from "next/server";

import { ingestAndProcessAgentEvent } from "@/lib/agent/processor";
import { listAgentEvents } from "@/lib/agent/events";
import { getEnv } from "@/lib/env";
import type { AgentEventStatus, AgentEventType } from "@/lib/types";

interface IncomingAgentEventPayload {
  eventType: AgentEventType;
  source?: "vscode" | "web";
  language?: string | null;
  payload?: Record<string, unknown>;
  filePath?: string | null;
  originalSnippet?: string | null;
  proposedSnippet?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const statusParam = searchParams.get("status");
  const limit = limitParam ? Math.min(Math.max(Number(limitParam) || 1, 1), 100) : 20;

  const events = await listAgentEvents({
    limit,
    status: isAgentEventStatus(statusParam) ? statusParam : undefined,
  });

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-agent-signature");
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid agent signature" }, { status: 401 });
  }

  const payload = parseJson(rawBody) as IncomingAgentEventPayload | null;
  if (!payload || !isAgentEventType(payload.eventType)) {
    return NextResponse.json({ message: "eventType is required" }, { status: 400 });
  }

  try {
    const event = await ingestAndProcessAgentEvent({
      eventType: payload.eventType,
      source: payload.source ?? "vscode",
      language: payload.language ?? null,
      payload: payload.payload ?? {},
      filePath: payload.filePath ?? null,
      originalSnippet: payload.originalSnippet ?? null,
      proposedSnippet: payload.proposedSnippet ?? null,
      metadata: payload.metadata ?? null,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("[api/agent/events] failed", error);
    return NextResponse.json({ message: "Failed to record agent event" }, { status: 500 });
  }
}

function isAgentEventType(value: unknown): value is AgentEventType {
  return value === "terminal" || value === "problem" || value === "translation" || value === "diff";
}

function isAgentEventStatus(value: unknown): value is AgentEventStatus {
  return value === "received" || value === "processing" || value === "ready" || value === "applied" || value === "error";
}

function parseJson(value: string) {
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn("[api/agent/events] invalid JSON payload", error);
    return null;
  }
}

function verifySignature(body: string, signature: string | null) {
  const { VS_AGENT_SIGNING_KEY } = getEnv();
  if (!VS_AGENT_SIGNING_KEY) {
    return true;
  }

  if (!signature) {
    return false;
  }

  const digest = createHmac("sha256", VS_AGENT_SIGNING_KEY).update(body).digest("hex");
  return timingSafeCompare(digest, signature);
}

function timingSafeCompare(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}
