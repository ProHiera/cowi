import { NextResponse } from "next/server";

import { getAgentEventById, updateAgentEventRecord, type AgentEventUpdateInput } from "@/lib/agent/events";
import type { AgentEventStatus } from "@/lib/types";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const event = await getAgentEventById(params.id);
  if (!event) {
    return NextResponse.json({ message: "Agent event not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const body = (await request.json().catch(() => ({}))) as {
    status?: AgentEventStatus;
    resolutionNotes?: string;
    fixStatus?: "suggested" | "applied" | "rejected";
  };

  if (body.status && !isAgentEventStatus(body.status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  if (!body.status && !body.resolutionNotes && !body.fixStatus) {
    return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
  }

  const payload: AgentEventUpdateInput = {};
  if (body.status) payload.status = body.status;
  if (body.resolutionNotes !== undefined) payload.resolution_notes = body.resolutionNotes;
  if (body.fixStatus) payload.fix_status = body.fixStatus;

  try {
    const updated = await updateAgentEventRecord(params.id, payload);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[api/agent/events/:id] update failed", error);
    return NextResponse.json({ message: "Failed to update agent event" }, { status: 500 });
  }
}

function isAgentEventStatus(value: unknown): value is AgentEventStatus {
  return value === "received" || value === "processing" || value === "ready" || value === "applied" || value === "error";
}
