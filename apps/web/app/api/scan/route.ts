import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { claudeJSON } from "@/lib/claude";
import type { ScanResult, ScanMode } from "@/lib/types";

const SCAN_SYSTEM = `You are SIREN, an on-scene emergency assistant. The user is pointing their
phone at the scene. You will receive one image and a mode hint
(medical | fire | accident | general).

Respond ONLY with JSON:
{
  "summary": "one sentence, <= 20 words, what you see",
  "actions": ["imperative, <= 10 words", "...", "..."]
}

Rules:
- Order actions by urgency.
- If unconscious person: first action mentions checking breathing / 911.
- If indoor fire: first action is "Get out, close doors behind you."
- Never ask questions. No disclaimers. Never say you are an AI.
- If the scene is unclear, still return 3 useful general actions.`;

const CANNED: Record<ScanMode, ScanResult> = {
  medical: {
    summary: "Scene unclear — applying general medical guidance.",
    actions: ["Check if person is responsive and breathing.", "Call 911 if not already done.", "Keep the person still and warm."],
  },
  fire: {
    summary: "Scene unclear — applying fire safety guidance.",
    actions: ["Get out immediately, close doors behind you.", "Call 911 from outside.", "Stay low if smoke is present."],
  },
  accident: {
    summary: "Scene unclear — applying accident guidance.",
    actions: ["Do not move injured persons unless in danger.", "Call 911 and stay on the line.", "Keep bystanders back from vehicles."],
  },
  general: {
    summary: "Scene assessed — general safety guidance provided.",
    actions: ["Ensure your own safety first.", "Call 911 and describe what you see.", "Keep a safe distance and wait for responders."],
  },
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { imageBase64: string; mode: ScanMode };

    let result: ScanResult;

    try {
      result = await claudeJSON<ScanResult>(
        SCAN_SYSTEM,
        `Mode: ${body.mode}. Analyze the scene.`,
        body.imageBase64
      );
      // Ensure exactly 3 actions
      while (result.actions.length < 3) result.actions.push("Stay calm and follow responder instructions.");
      result.actions = result.actions.slice(0, 3) as [string, string, string];
    } catch {
      result = CANNED[body.mode] ?? CANNED.general;
    }

    await db.scanEvent.create({
      data: {
        mode: body.mode,
        summary: result.summary,
        actions: JSON.stringify(result.actions),
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("scan error:", err);
    return NextResponse.json({ error: "Scan failed", code: "SCAN_ERROR" }, { status: 500 });
  }
}
