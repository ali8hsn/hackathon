import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const sessions = await db.intakeSession.findMany({
    where: { status: { in: ["intake", "active"] } },
    orderBy: { startedAt: "desc" },
    take: 10,
  });
  return NextResponse.json(sessions);
}
