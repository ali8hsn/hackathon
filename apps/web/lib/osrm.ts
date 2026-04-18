const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

export interface OSRMRoute {
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  durationSec: number;
  distanceM: number;
}

export interface OSRMResult {
  primary: OSRMRoute;
  alternatives: OSRMRoute[];
}

export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  alternatives = true
): Promise<OSRMResult> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson${alternatives ? "&alternatives=true" : ""}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

    const data = (await res.json()) as {
      code: string;
      routes: Array<{
        geometry: { type: "LineString"; coordinates: [number, number][] };
        duration: number;
        distance: number;
      }>;
    };

    if (data.code !== "Ok" || !data.routes.length) {
      throw new Error("OSRM returned no routes");
    }

    const toRoute = (r: (typeof data.routes)[0]): OSRMRoute => ({
      geometry: r.geometry,
      durationSec: Math.round(r.duration),
      distanceM: Math.round(r.distance),
    });

    const [primary, ...rest] = data.routes;
    return { primary: toRoute(primary), alternatives: rest.map(toRoute) };
  } catch {
    clearTimeout(timeout);
    // Fallback: straight-line mock route
    const mockCoords: [number, number][] = [
      [from.lng, from.lat],
      [(from.lng + to.lng) / 2, (from.lat + to.lat) / 2],
      [to.lng, to.lat],
    ];
    const dLat = to.lat - from.lat;
    const dLng = to.lng - from.lng;
    const distM = Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111320);
    const mockRoute: OSRMRoute = {
      geometry: { type: "LineString", coordinates: mockCoords },
      durationSec: Math.round(distM / 14), // ~50km/h
      distanceM: distM,
    };
    return { primary: mockRoute, alternatives: [] };
  }
}

/** Sample N evenly-spaced points along a GeoJSON LineString */
export function samplePoints(
  coords: [number, number][],
  n: number
): Array<{ lat: number; lng: number }> {
  if (coords.length === 0) return [];
  if (n <= 1) return [{ lat: coords[0][1], lng: coords[0][0] }];

  const step = Math.max(1, Math.floor(coords.length / n));
  const pts: Array<{ lat: number; lng: number }> = [];
  for (let i = 0; i < coords.length; i += step) {
    pts.push({ lat: coords[i][1], lng: coords[i][0] });
    if (pts.length >= n) break;
  }
  return pts;
}
