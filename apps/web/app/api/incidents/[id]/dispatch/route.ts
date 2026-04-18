import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRoute } from "@/lib/osrm";

const TYPE_TO_KIND: Record<string, string[]> = {
  medical: ["medic", "engine"],
  fire: ["engine", "medic"],
  accident: ["medic", "police", "engine"],
  hazmat: ["engine", "medic"],
  other: ["police", "medic", "engine"],
};

function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = a.lat - b.lat;
  const dLng = a.lng - b.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const incident = await db.incident.findUnique({ where: { id } });
    if (!incident) {
      return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const preferred = TYPE_TO_KIND[incident.type] ?? ["medic"];

    // Find nearest available unit matching preferred kinds
    const units = await db.unit.findMany({ where: { status: "available" } });
    const sorted = units
      .filter((u) => preferred.includes(u.kind))
      .sort((a, b) => distance(incident, a) - distance(incident, b));

    const unit = sorted[0] ?? units.sort((a, b) => distance(incident, a) - distance(incident, b))[0];

    if (!unit) {
      return NextResponse.json({ error: "No available units", code: "NO_UNITS" }, { status: 409 });
    }

    const routeResult = await getRoute(
      { lat: unit.lat, lng: unit.lng },
      { lat: incident.lat, lng: incident.lng }
    );

    const eta = routeResult.primary.durationSec;

    await db.incident.update({
      where: { id },
      data: { status: "dispatched", assignedUnitId: unit.id, eta },
    });

    await db.unit.update({
      where: { id: unit.id },
      data: { status: "dispatched" },
    });

    return NextResponse.json({
      unit,
      route: routeResult.primary,
      eta,
    });
  } catch (err) {
    console.error("dispatch error:", err);
    return NextResponse.json({ error: "Dispatch failed", code: "DISPATCH_ERROR" }, { status: 500 });
  }
}
