import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { lat?: number; lng?: number };

    const session = await db.intakeSession.create({
      data: {
        lat: body.lat ?? null,
        lng: body.lng ?? null,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error("intake/start error:", err);
    return NextResponse.json({ error: "Failed to start session", code: "START_ERROR" }, { status: 500 });
  }
}
