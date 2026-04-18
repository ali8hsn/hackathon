import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const incidents = await db.incident.findMany({
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { assignedUnit: true },
    });
    return NextResponse.json(incidents);
  } catch (err) {
    console.error("incidents GET error:", err);
    return NextResponse.json({ error: "Failed to fetch incidents", code: "FETCH_ERROR" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type: string;
      severity: number;
      lat: number;
      lng: number;
      address?: string;
      description?: string;
      reporterKind?: string;
    };

    const incident = await db.incident.create({
      data: {
        type: body.type,
        severity: body.severity,
        lat: body.lat,
        lng: body.lng,
        address: body.address,
        description: body.description,
        reporterKind: body.reporterKind ?? "dispatcher",
      },
      include: { assignedUnit: true },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (err) {
    console.error("incidents POST error:", err);
    return NextResponse.json({ error: "Failed to create incident", code: "CREATE_ERROR" }, { status: 500 });
  }
}
