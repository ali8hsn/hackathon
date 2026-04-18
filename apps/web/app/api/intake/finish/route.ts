import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { IncidentTicket } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId: string };

    const session = await db.intakeSession.findUnique({ where: { id: body.sessionId } });
    if (!session) {
      return NextResponse.json({ error: "Session not found", code: "NOT_FOUND" }, { status: 404 });
    }

    let ticket: IncidentTicket;
    try {
      ticket = JSON.parse(session.ticket) as IncidentTicket;
    } catch {
      ticket = {
        status: "intake",
        type: "other",
        severity: 3,
        location_guess: null,
        summary: "Intake call completed",
        key_observations: [],
        life_safety_flags: [],
        follow_up_questions: [],
        confidence: 0.5,
      };
    }

    const incident = await db.incident.create({
      data: {
        type: ticket.type === "unknown" ? "other" : ticket.type,
        severity: ticket.severity ?? 3,
        lat: session.lat ?? 30.2672,
        lng: session.lng ?? -97.7431,
        address: ticket.location_guess ?? undefined,
        description: ticket.summary,
        reporterKind: "intake",
        intakeSessionId: session.id,
      },
    });

    await db.intakeSession.update({
      where: { id: body.sessionId },
      data: { status: "handed_off", endedAt: new Date(), incidentId: incident.id },
    });

    return NextResponse.json({ incidentId: incident.id });
  } catch (err) {
    console.error("intake/finish error:", err);
    return NextResponse.json({ error: "Finish failed", code: "FINISH_ERROR" }, { status: 500 });
  }
}
