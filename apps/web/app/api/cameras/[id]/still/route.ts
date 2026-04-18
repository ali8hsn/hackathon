import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Tiny 1x1 gray JPEG placeholder
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240">
  <rect width="320" height="240" fill="#1a1a2e"/>
  <text x="160" y="110" text-anchor="middle" fill="#555" font-family="monospace" font-size="14">Camera Feed</text>
  <text x="160" y="135" text-anchor="middle" fill="#444" font-family="monospace" font-size="11">Unavailable</text>
  <circle cx="160" cy="175" r="20" fill="none" stroke="#333" stroke-width="2"/>
  <line x1="150" y1="165" x2="160" y2="155" stroke="#333" stroke-width="2"/>
  <line x1="170" y1="165" x2="160" y2="155" stroke="#333" stroke-width="2"/>
</svg>`;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const camera = await db.camera.findUnique({ where: { id } });

    if (!camera?.stillUrl) {
      return new NextResponse(PLACEHOLDER_SVG, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=15",
        },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(camera.stillUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Upstream ${res.status}`);

      const contentType = res.headers.get("content-type") ?? "image/jpeg";
      const buffer = await res.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=15",
        },
      });
    } catch {
      clearTimeout(timeout);
      return new NextResponse(PLACEHOLDER_SVG, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=15",
        },
      });
    }
  } catch (err) {
    console.error("camera still error:", err);
    return new NextResponse(PLACEHOLDER_SVG, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=15",
      },
    });
  }
}
