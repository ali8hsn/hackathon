import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const at = searchParams.get("at") ?? new Date().toISOString();
  const mlUrl = process.env.ML_SERVICE_URL ?? "http://localhost:8001";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${mlUrl}/heatmap?at=${encodeURIComponent(at)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`ML service ${res.status}`);

    const geojson = await res.json();
    return NextResponse.json(geojson);
  } catch {
    // Fallback: return a minimal Austin heatmap so the UI doesn't break
    const features = generateFallbackHeatmap(at);
    return NextResponse.json({ type: "FeatureCollection", features });
  }
}

function generateFallbackHeatmap(at: string) {
  const hour = new Date(at).getHours();
  const hotspots = [
    { lat: 30.2672, lng: -97.7431, weight: 1.0 },   // downtown
    { lat: 30.3598, lng: -97.7143, weight: 0.7 },    // north Austin
    { lat: 30.2774, lng: -97.7013, weight: 0.6 },    // east Austin
  ];

  const features: unknown[] = [];
  const rng = (seed: number) => Math.abs(Math.sin(seed + hour) * 0.5 + 0.5);

  for (const hs of hotspots) {
    for (let i = 0; i < 30; i++) {
      const seed = i * 7 + hs.lat * 100;
      const lat = hs.lat + (rng(seed) - 0.5) * 0.06;
      const lng = hs.lng + (rng(seed + 1) - 0.5) * 0.08;
      const intensity = hs.weight * rng(seed + 2) * 0.8;

      features.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: [lng, lat] },
        properties: { intensity },
      });
    }
  }

  return features;
}
