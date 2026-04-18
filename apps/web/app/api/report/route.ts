import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { claudeJSON } from "@/lib/claude";

interface ReportTriage {
  type: string;
  severity: number;
  suggested_units: string[];
  summary: string;
}

const TRIAGE_SYSTEM = `You are a 911 triage assistant classifying a non-urgent citizen report
(description + optional image). Respond ONLY with JSON:
{
  "type": "medical" | "fire" | "accident" | "hazmat" | "other",
  "severity": 1-5,
  "suggested_units": ["medic" | "engine" | "police"],
  "summary": "<=20 words, neutral"
}`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      lat: number;
      lng: number;
      description: string;
      mediaBase64?: string;
    };

    let triage: ReportTriage;
    try {
      triage = await claudeJSON<ReportTriage>(
        TRIAGE_SYSTEM,
        body.description,
        body.mediaBase64
      );
    } catch {
      triage = { type: "other", severity: 2, suggested_units: ["police"], summary: body.description.slice(0, 80) };
    }

    const incident = await db.incident.create({
      data: {
        type: triage.type,
        severity: triage.severity,
        lat: body.lat,
        lng: body.lng,
        description: triage.summary,
        reporterKind: "citizen",
      },
    });

    return NextResponse.json(incident, { status: 201 });
  } catch (err) {
    console.error("report error:", err);
    return NextResponse.json({ error: "Report failed", code: "REPORT_ERROR" }, { status: 500 });
  }
}
