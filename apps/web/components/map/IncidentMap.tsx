"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { Incident, Camera, Unit, RouteGeoJSON } from "@/components/dashboard/DashboardClient";
import { CameraPopover } from "@/components/map/CameraPopover";

interface Props {
  incidents: Incident[];
  cameras: Camera[];
  units: Unit[];
  activeRoute: RouteGeoJSON | null;
  showHeatmap: boolean;
  onIncidentClick: (id: string) => void;
}

const SEVERITY_COLORS: Record<number, string> = {
  1: "#6b7280",
  2: "#3b82f6",
  3: "#f59e0b",
  4: "#f97316",
  5: "#ef4444",
};

const UNIT_COLORS: Record<string, string> = {
  engine: "#f97316",
  medic: "#22c55e",
  police: "#3b82f6",
};

export default function IncidentMap({ incidents, cameras, units, activeRoute, showHeatmap, onIncidentClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const init = async () => {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
          glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        },
        center: [-97.7431, 30.2672],
        zoom: 11,
      });

      map.on("load", () => {
        // Route layer placeholder
        map.addSource("route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: { "line-color": "#6366f1", "line-width": 4, "line-opacity": 0.9 },
        });

        // Heatmap layer
        map.addSource("heatmap", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "heatmap-layer",
          type: "heatmap",
          source: "heatmap",
          layout: { visibility: "none" },
          paint: {
            "heatmap-weight": ["get", "intensity"],
            "heatmap-intensity": 1.5,
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,255,0)",
              0.2, "rgba(0,255,255,0.5)",
              0.5, "rgba(0,255,0,0.7)",
              0.8, "rgba(255,165,0,0.8)",
              1, "rgba(255,0,0,0.9)",
            ],
            "heatmap-radius": 30,
            "heatmap-opacity": 0.7,
          },
        });
      });

      mapRef.current = map;
    };

    void init();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const addMarker = async () => {
      const maplibregl = (await import("maplibre-gl")).default;

      // Incident pins
      for (const inc of incidents) {
        const el = document.createElement("div");
        el.className = "cursor-pointer";
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 50%;
          background: ${SEVERITY_COLORS[inc.severity] ?? "#6b7280"};
          border: 2px solid white;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: bold; color: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        `;
        el.textContent = String(inc.severity);
        el.addEventListener("click", () => onIncidentClick(inc.id));

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([inc.lng, inc.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }

      // Unit labels
      for (const unit of units) {
        const el = document.createElement("div");
        el.style.cssText = `
          background: ${UNIT_COLORS[unit.kind] ?? "#6b7280"};
          color: white; font-size: 10px; font-weight: bold;
          padding: 2px 6px; border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
          white-space: nowrap;
        `;
        el.textContent = unit.callsign;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([unit.lng, unit.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }

      // Camera pins
      for (const cam of cameras) {
        const congestion = cam.lastCongestion ?? 0;
        const color = congestion > 0.6 ? "#ef4444" : congestion > 0.3 ? "#f59e0b" : "#22c55e";

        const el = document.createElement("div");
        el.style.cssText = `
          width: 10px; height: 10px; border-radius: 50%;
          background: ${color}; border: 1.5px solid rgba(255,255,255,0.6);
          cursor: pointer;
        `;
        el.addEventListener("click", (e) => {
          setSelectedCamera(cam);
          setPopoverPos({ x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY });
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([cam.lng, cam.lat])
          .addTo(map);
        markersRef.current.push(marker);
      }
    };

    void addMarker();
  }, [incidents, cameras, units, onIncidentClick]);

  // Update route
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (activeRoute) {
      source.setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", geometry: activeRoute.geometry, properties: {} }],
      });
    } else {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }, [activeRoute]);

  // Toggle heatmap
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const fetchAndShow = async () => {
      if (showHeatmap) {
        try {
          const res = await fetch(`/api/heatmap?at=${new Date().toISOString()}`);
          if (res.ok) {
            const geojson = await res.json();
            const src = map.getSource("heatmap") as maplibregl.GeoJSONSource | undefined;
            src?.setData(geojson);
          }
        } catch { /* ignore */ }
        map.setLayoutProperty("heatmap-layer", "visibility", "visible");
      } else {
        map.setLayoutProperty("heatmap-layer", "visibility", "none");
      }
    };

    void fetchAndShow();
  }, [showHeatmap]);

  return (
    <>
      <div ref={containerRef} className="w-full h-full" />
      {selectedCamera && popoverPos && (
        <CameraPopover
          camera={selectedCamera}
          position={popoverPos}
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </>
  );
}
