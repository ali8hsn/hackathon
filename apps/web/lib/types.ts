export type IncidentType = "medical" | "fire" | "accident" | "hazmat" | "other";
export type IncidentStatus = "open" | "dispatched" | "enroute" | "onscene" | "closed";
export type UnitKind = "engine" | "medic" | "police";
export type UnitStatus = "available" | "dispatched" | "enroute" | "onscene" | "outofservice";
export type ScanMode = "medical" | "fire" | "accident" | "general";

export interface IncidentTicket {
  status: "intake" | "ready_for_dispatcher";
  type: IncidentType | "unknown";
  severity: 1 | 2 | 3 | 4 | 5 | null;
  location_guess: string | null;
  summary: string;
  key_observations: string[];
  life_safety_flags: string[];
  follow_up_questions: string[];
  confidence: number;
}

export interface CameraFeed {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stillUrl: string;
  lastCongestion?: number | null;
  lastSampledAt?: string | null;
}

export interface RouteResult {
  geometry: GeoJSON.LineString;
  durationSec: number;
  distanceM: number;
  congestionAdjustedSec: number;
  cameraIdsAlongRoute: string[];
}

export interface ScanResult {
  summary: string;
  actions: [string, string, string];
}

export interface ApiError {
  error: string;
  code: string;
}

// GeoJSON types
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace GeoJSON {
    interface LineString {
      type: "LineString";
      coordinates: [number, number][];
    }
    interface FeatureCollection {
      type: "FeatureCollection";
      features: Feature[];
    }
    interface Feature {
      type: "Feature";
      geometry: Geometry;
      properties: Record<string, unknown> | null;
    }
    type Geometry = Point | LineString | Polygon;
    interface Point {
      type: "Point";
      coordinates: [number, number];
    }
    interface Polygon {
      type: "Polygon";
      coordinates: [number, number][][];
    }
  }
}
