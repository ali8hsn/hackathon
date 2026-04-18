import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRoute, samplePoints } from "@/lib/osrm";
import { scoreCamera } from "@/lib/congestion";

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (!fromParam || !toParam) {
    return NextResponse.json({ error: "Missing from or to", code: "BAD_REQUEST" }, { status: 400 });
  }

  const [fromLat, fromLng] = fromParam.split(",").map(Number);
  const [toLat, toLng] = toParam.split(",").map(Number);

  if ([fromLat, fromLng, toLat, toLng].some(isNaN)) {
    return NextResponse.json({ error: "Invalid coordinates", code: "BAD_REQUEST" }, { status: 400 });
  }

  try {
    const osrmResult = await getRoute(
      { lat: fromLat, lng: fromLng },
      { lat: toLat, lng: toLng }
    );

    const route = osrmResult.primary;

    // Sample 10 points along the route
    const samplePts = samplePoints(route.geometry.coordinates, 10);

    // Load all cameras
    const cameras = await db.camera.findMany();

    // Find cameras within 200m of any sampled point
    const THRESHOLD_KM = 0.2;
    const nearbyCameraIds = new Set<string>();
    for (const pt of samplePts) {
      for (const cam of cameras) {
        const dist = haversineKm(pt.lat, pt.lng, cam.lat, cam.lng);
        if (dist <= THRESHOLD_KM) {
          nearbyCameraIds.add(cam.id);
        }
      }
    }

    const nearbyCameras = cameras.filter((c) => nearbyCameraIds.has(c.id));

    // Score each camera in parallel
    const scoreResults = await Promise.allSettled(
      nearbyCameras.map((c) => scoreCamera(c.id, c.stillUrl))
    );

    const scores: number[] = [];
    for (let i = 0; i < scoreResults.length; i++) {
      const r = scoreResults[i];
      if (r.status === "fulfilled") {
        scores.push(r.value);
        // Update DB with latest congestion score
        void db.camera.update({
          where: { id: nearbyCameras[i].id },
          data: { lastCongestion: r.value, lastSampledAt: new Date() },
        }).catch(() => {});
      }
    }

    const meanCongestion = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const congestionAdjustedSec = Math.round(route.durationSec + meanCongestion * 0.3 * route.durationSec);

    return NextResponse.json({
      geometry: route.geometry,
      durationSec: route.durationSec,
      distanceM: route.distanceM,
      congestionAdjustedSec,
      cameraIdsAlongRoute: Array.from(nearbyCameraIds),
    });
  } catch (err) {
    console.error("route error:", err);
    return NextResponse.json({ error: "Route computation failed", code: "ROUTE_ERROR" }, { status: 500 });
  }
}
