import type { CameraFeed } from "@/lib/types";

// Socrata endpoint for Austin traffic cameras
const AUSTIN_CAMERAS_URL =
  "https://data.austintexas.gov/resource/b4k4-adkb.json?$limit=200";

// Fallback seed: ~50 Austin traffic cameras hand-coded
const FALLBACK_CAMERAS: CameraFeed[] = [
  { id: "atx-001", name: "I-35 @ 6th St", lat: 30.2674, lng: -97.7362, stillUrl: "" },
  { id: "atx-002", name: "I-35 @ 12th St", lat: 30.2771, lng: -97.7358, stillUrl: "" },
  { id: "atx-003", name: "I-35 @ Rundberg Ln", lat: 30.3632, lng: -97.7099, stillUrl: "" },
  { id: "atx-004", name: "MoPac @ 183", lat: 30.4024, lng: -97.7454, stillUrl: "" },
  { id: "atx-005", name: "MoPac @ Barton Springs", lat: 30.2520, lng: -97.7720, stillUrl: "" },
  { id: "atx-006", name: "US-183 @ Ed Bluestein", lat: 30.3141, lng: -97.6877, stillUrl: "" },
  { id: "atx-007", name: "US-290 @ Lamar Blvd", lat: 30.2858, lng: -97.7537, stillUrl: "" },
  { id: "atx-008", name: "SH-71 @ US-183", lat: 30.1887, lng: -97.6908, stillUrl: "" },
  { id: "atx-009", name: "Ben White @ S Lamar", lat: 30.2290, lng: -97.7730, stillUrl: "" },
  { id: "atx-010", name: "RM-2222 @ Mesa Dr", lat: 30.3426, lng: -97.7793, stillUrl: "" },
  { id: "atx-011", name: "Congress Ave @ 6th St", lat: 30.2679, lng: -97.7406, stillUrl: "" },
  { id: "atx-012", name: "Lamar Blvd @ 38th St", lat: 30.3064, lng: -97.7432, stillUrl: "" },
  { id: "atx-013", name: "Airport Blvd @ 51st St", lat: 30.3241, lng: -97.7104, stillUrl: "" },
  { id: "atx-014", name: "MLK Jr Blvd @ Speedway", lat: 30.2862, lng: -97.7382, stillUrl: "" },
  { id: "atx-015", name: "Riverside Dr @ S Congress", lat: 30.2414, lng: -97.7492, stillUrl: "" },
  { id: "atx-016", name: "E Oltorf @ S Congress", lat: 30.2270, lng: -97.7498, stillUrl: "" },
  { id: "atx-017", name: "William Cannon @ S 1st", lat: 30.2064, lng: -97.7703, stillUrl: "" },
  { id: "atx-018", name: "Slaughter Ln @ S MoPac", lat: 30.1766, lng: -97.7963, stillUrl: "" },
  { id: "atx-019", name: "Parmer Ln @ N Lamar", lat: 30.4380, lng: -97.7399, stillUrl: "" },
  { id: "atx-020", name: "Anderson Ln @ Burnet Rd", lat: 30.3581, lng: -97.7397, stillUrl: "" },
  { id: "atx-021", name: "Rundberg @ N Lamar", lat: 30.3621, lng: -97.7421, stillUrl: "" },
  { id: "atx-022", name: "I-35 @ 51st St", lat: 30.3236, lng: -97.7062, stillUrl: "" },
  { id: "atx-023", name: "I-35 @ Ben White", lat: 30.2289, lng: -97.7082, stillUrl: "" },
  { id: "atx-024", name: "US-290 @ I-35", lat: 30.2302, lng: -97.7100, stillUrl: "" },
  { id: "atx-025", name: "SH-45 @ MoPac", lat: 30.1614, lng: -97.8004, stillUrl: "" },
  { id: "atx-026", name: "RM-2222 @ Balcones Dr", lat: 30.3427, lng: -97.7528, stillUrl: "" },
  { id: "atx-027", name: "Cesar Chavez @ S Lamar", lat: 30.2558, lng: -97.7578, stillUrl: "" },
  { id: "atx-028", name: "N Loop @ Burnet Rd", lat: 30.3219, lng: -97.7388, stillUrl: "" },
  { id: "atx-029", name: "FM 734 @ US-183", lat: 30.3785, lng: -97.6778, stillUrl: "" },
  { id: "atx-030", name: "Howard Ln @ US-183", lat: 30.4166, lng: -97.6789, stillUrl: "" },
  { id: "atx-031", name: "Koenig Ln @ N Lamar", lat: 30.3209, lng: -97.7431, stillUrl: "" },
  { id: "atx-032", name: "E Cesar Chavez @ Pleasant Valley", lat: 30.2578, lng: -97.7149, stillUrl: "" },
  { id: "atx-033", name: "S Congress @ Oltorf", lat: 30.2307, lng: -97.7500, stillUrl: "" },
  { id: "atx-034", name: "Manor Rd @ I-35", lat: 30.2956, lng: -97.7089, stillUrl: "" },
  { id: "atx-035", name: "Springdale Rd @ E 7th", lat: 30.2666, lng: -97.7015, stillUrl: "" },
  { id: "atx-036", name: "Burnett Rd @ 45th St", lat: 30.3117, lng: -97.7396, stillUrl: "" },
  { id: "atx-037", name: "Metric Blvd @ 183", lat: 30.3760, lng: -97.7188, stillUrl: "" },
  { id: "atx-038", name: "N Capital of TX @ 183", lat: 30.3624, lng: -97.7896, stillUrl: "" },
  { id: "atx-039", name: "S MoPac @ Slaughter Ln", lat: 30.1787, lng: -97.8001, stillUrl: "" },
  { id: "atx-040", name: "Brodie Ln @ Slaughter Ln", lat: 30.1773, lng: -97.8193, stillUrl: "" },
  { id: "atx-041", name: "Manchaca Rd @ Ben White", lat: 30.2278, lng: -97.7907, stillUrl: "" },
  { id: "atx-042", name: "S Lamar @ Manchaca Rd", lat: 30.2190, lng: -97.7751, stillUrl: "" },
  { id: "atx-043", name: "Barton Springs @ S MoPac", lat: 30.2543, lng: -97.7734, stillUrl: "" },
  { id: "atx-044", name: "W 6th St @ Lamar Blvd", lat: 30.2695, lng: -97.7567, stillUrl: "" },
  { id: "atx-045", name: "Red River @ 6th St", lat: 30.2683, lng: -97.7340, stillUrl: "" },
  { id: "atx-046", name: "E 11th St @ N Congress", lat: 30.2808, lng: -97.7394, stillUrl: "" },
  { id: "atx-047", name: "N IH-35 @ US-290", lat: 30.3047, lng: -97.7082, stillUrl: "" },
  { id: "atx-048", name: "SH-71 @ SH-130", lat: 30.1773, lng: -97.5802, stillUrl: "" },
  { id: "atx-049", name: "N MoPac @ 2222", lat: 30.3618, lng: -97.7527, stillUrl: "" },
  { id: "atx-050", name: "Rundberg @ Metric Blvd", lat: 30.3630, lng: -97.7143, stillUrl: "" },
];

interface SocrataCamera {
  camera_id?: string;
  atd_device_id?: string;
  primary_st?: string;
  cross_st?: string;
  location_latitude?: string;
  location_longitude?: string;
  screenshot_address?: string;
}

export async function fetchCameras(): Promise<CameraFeed[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(AUSTIN_CAMERAS_URL, {
      signal: controller.signal,
      next: { revalidate: 300 },
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = (await res.json()) as SocrataCamera[];

    const cameras: CameraFeed[] = data
      .filter((c) => c.location_latitude && c.location_longitude)
      .map((c) => ({
        id: c.camera_id ?? c.atd_device_id ?? `atx-live-${Math.random()}`,
        name: [c.primary_st, c.cross_st].filter(Boolean).join(" @ ") || "Austin Camera",
        lat: parseFloat(c.location_latitude!),
        lng: parseFloat(c.location_longitude!),
        stillUrl: c.screenshot_address ?? "",
      }))
      .filter((c) => !isNaN(c.lat) && !isNaN(c.lng));

    return cameras.length > 0 ? cameras : FALLBACK_CAMERAS;
  } catch {
    return FALLBACK_CAMERAS;
  }
}

export { FALLBACK_CAMERAS };
