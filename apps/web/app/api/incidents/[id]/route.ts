import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const incident = await db.incident.findUnique({
      where: { id },
      include: { assignedUnit: true, intakeSession: true },
    });
    if (!incident) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json(incident);
  } catch (err) {
    console.error("incident GET error:", err);
    return NextResponse.json({ error: "Failed to fetch", code: "FETCH_ERROR" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json() as Partial<{
      status: string;
      severity: number;
      assignedUnitId: string;
      eta: number;
      description: string;
    }>;

    const incident = await db.incident.update({
      where: { id },
      data: body,
      include: { assignedUnit: true },
    });

    return NextResponse.json(incident);
  } catch (err) {
    console.error("incident PATCH error:", err);
    return NextResponse.json({ error: "Failed to update", code: "UPDATE_ERROR" }, { status: 500 });
  }
}
