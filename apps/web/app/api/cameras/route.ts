import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchCameras } from "@/lib/austin";

export async function GET() {
  try {
    let cameras = await db.camera.findMany();

    if (cameras.length === 0) {
      // Populate from live feed or fallback
      const fetched = await fetchCameras();
      for (const c of fetched) {
        await db.camera.upsert({
          where: { id: c.id },
          update: {},
          create: { id: c.id, name: c.name, lat: c.lat, lng: c.lng, stillUrl: c.stillUrl },
        });
      }
      cameras = await db.camera.findMany();
    }

    return NextResponse.json(cameras);
  } catch (err) {
    console.error("cameras GET error:", err);
    return NextResponse.json({ error: "Failed to fetch cameras", code: "FETCH_ERROR" }, { status: 500 });
  }
}
