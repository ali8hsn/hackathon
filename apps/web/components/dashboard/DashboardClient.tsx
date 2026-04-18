"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { IncidentQueue } from "@/components/incidents/IncidentQueue";
import { IncidentDetailDrawer } from "@/components/incidents/IncidentDetailDrawer";

// MapLibre must be client-only (no SSR)
const IncidentMap = dynamic(() => import("@/components/map/IncidentMap"), { ssr: false });

export interface Incident {
  id: string;
  createdAt: string;
  type: string;
  severity: number;
  lat: number;
  lng: number;
  address?: string | null;
  description?: string | null;
  status: string;
  assignedUnitId?: string | null;
  eta?: number | null;
  assignedUnit?: { id: string; callsign: string; kind: string; lat: number; lng: number; status: string } | null;
}

export interface Camera {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stillUrl: string;
  lastCongestion?: number | null;
}

export interface Unit {
  id: string;
  callsign: string;
  kind: string;
  lat: number;
  lng: number;
  status: string;
}

export interface RouteGeoJSON {
  geometry: { type: "LineString"; coordinates: [number, number][] };
  durationSec: number;
  distanceM: number;
  congestionAdjustedSec: number;
  cameraIdsAlongRoute: string[];
}

export function DashboardClient() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<RouteGeoJSON | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [incRes, camRes] = await Promise.all([
        fetch("/api/incidents"),
        fetch("/api/cameras"),
      ]);
      if (incRes.ok) {
        const data = (await incRes.json()) as Incident[];
        setIncidents(data);
        // Extract units from incidents
        const unitMap = new Map<string, Unit>();
        for (const inc of data) {
          if (inc.assignedUnit) unitMap.set(inc.assignedUnit.id, inc.assignedUnit);
        }
        setUnits(Array.from(unitMap.values()));
      }
      if (camRes.ok) {
        const cams = (await camRes.json()) as Camera[];
        setCameras(cams);
      }
    } catch {
      // Network error; keep stale data
    }
  }, []);

  useEffect(() => {
    // reason: polling pattern — fetchAll updates state from external source, not an effect cascade
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAll();
    const interval = setInterval(() => void fetchAll(), 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const selectedIncident = incidents.find((i) => i.id === selectedId) ?? null;

  const handleDispatch = useCallback(async (incidentId: string) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/dispatch`, { method: "POST" });
      if (!res.ok) return;
      const data = (await res.json()) as { unit: Unit; route: RouteGeoJSON; eta: number };
      setActiveRoute(data.route);
      void fetchAll();
    } catch {
      // ignore
    }
  }, [fetchAll]);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Map — 65% */}
      <div className="relative flex-1" style={{ minWidth: 0 }}>
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <span className="text-zinc-100 font-bold tracking-wider text-xl">SIREN</span>
          <span className="text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5">DISPATCH</span>
        </div>

        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              showHeatmap
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            Predictive Heatmap
          </button>
        </div>

        <IncidentMap
          incidents={incidents}
          cameras={cameras}
          units={units}
          activeRoute={activeRoute}
          showHeatmap={showHeatmap}
          onIncidentClick={setSelectedId}
        />
      </div>

      {/* Queue — 35% */}
      <div className="w-[35%] min-w-[320px] max-w-[480px] border-l border-zinc-800 flex flex-col overflow-hidden">
        <IncidentQueue
          incidents={incidents}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      {/* Detail drawer */}
      {selectedIncident && (
        <IncidentDetailDrawer
          incident={selectedIncident}
          cameras={cameras.filter((c) => activeRoute?.cameraIdsAlongRoute.includes(c.id) ?? false)}
          onClose={() => setSelectedId(null)}
          onDispatch={handleDispatch}
        />
      )}
    </div>
  );
}
