import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildTicket } from "@/lib/intake";

// Track last AI voice time per session (in-process; resets on deploy, fine for demo)
const lastVoiceTime = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId: string; transcriptDelta: string };

    const session = await db.intakeSession.findUnique({ where: { id: body.sessionId } });
    if (!session) {
      return NextResponse.json({ error: "Session not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const transcript = session.transcript + (session.transcript ? " " : "") + body.transcriptDelta;

    const ticket = await buildTicket(transcript, session.lat, session.lng);

    const now = Date.now();
    let aiFollowUp: string | undefined;
    const lastVoice = lastVoiceTime.get(body.sessionId) ?? 0;

    if (ticket.follow_up_questions[0] && now - lastVoice >= 3000) {
      aiFollowUp = ticket.follow_up_questions[0];
      lastVoiceTime.set(body.sessionId, now);
    }

    await db.intakeSession.update({
      where: { id: body.sessionId },
      data: {
        transcript,
        ticket: JSON.stringify(ticket),
        status: ticket.status === "ready_for_dispatcher" ? "ready" : "intake",
      },
    });

    return NextResponse.json({ ticket, aiFollowUp });
  } catch (err) {
    console.error("intake/chunk error:", err);
    return NextResponse.json({ error: "Chunk failed", code: "CHUNK_ERROR" }, { status: 500 });
  }
}
