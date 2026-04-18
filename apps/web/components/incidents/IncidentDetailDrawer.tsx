"use client";

import { useState } from "react";
import { X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Incident, Camera } from "@/components/dashboard/DashboardClient";

interface Props {
  incident: Incident;
  cameras: Camera[];
  onClose: () => void;
  onDispatch: (id: string) => void;
}

export function IncidentDetailDrawer({ incident, cameras, onClose, onDispatch }: Props) {
  const [dispatching, setDispatching] = useState(false);

  const handleDispatch = async () => {
    setDispatching(true);
    await onDispatch(incident.id);
    setDispatching(false);
  };

  const statusColors: Record<string, string> = {
    open: "text-red-400 bg-red-500/10 border-red-500/30",
    dispatched: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    enroute: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    onscene: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    closed: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 capitalize">
            {incident.type} Incident
          </h2>
          <p className="text-xs text-zinc-500 font-mono">{incident.id.slice(0, 12)}…</p>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Status & Severity */}
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${statusColors[incident.status] ?? statusColors.open}`}>
            {incident.status}
          </span>
          <span className="text-xs text-zinc-300">
            Severity <span className="font-bold text-white">{incident.severity}</span>/5
          </span>
        </div>

        {/* Description */}
        {incident.description && (
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-zinc-200">{incident.description}</p>
          </div>
        )}

        {/* Location */}
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Location</p>
          <p className="text-sm text-zinc-200 font-mono">
            {incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}
          </p>
          {incident.address && <p className="text-xs text-zinc-400 mt-0.5">{incident.address}</p>}
        </div>

        {/* Assigned unit */}
        {incident.assignedUnit && (
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Assigned Unit</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-indigo-400">{incident.assignedUnit.callsign}</span>
              <span className="text-xs text-zinc-400 capitalize">{incident.assignedUnit.kind}</span>
              {incident.eta && (
                <span className="text-xs text-emerald-400">ETA {Math.round(incident.eta / 60)}m</span>
              )}
            </div>
          </div>
        )}

        {/* Cameras along route */}
        {cameras.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
              Cameras Along Route ({cameras.length})
            </p>
            <div className="space-y-2">
              {cameras.slice(0, 4).map((cam) => {
                const cong = cam.lastCongestion;
                const color = cong == null ? "text-zinc-400"
                  : cong > 0.6 ? "text-red-400"
                  : cong > 0.3 ? "text-amber-400"
                  : "text-emerald-400";
                return (
                  <div key={cam.id} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/cameras/${cam.id}/still`}
                      alt={cam.name}
                      className="w-16 h-12 object-cover rounded bg-zinc-700"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-300 truncate">{cam.name}</p>
                      <p className={`text-xs font-medium ${color}`}>
                        {cong == null ? "Unknown" : cong > 0.6 ? "Congested" : cong > 0.3 ? "Moderate" : "Clear"}
                        {cong != null && ` · ${(cong * 100).toFixed(0)}%`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-zinc-800 space-y-2">
        {incident.status === "open" && !incident.assignedUnitId && (
          <Button
            onClick={handleDispatch}
            disabled={dispatching}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            <Zap className="w-4 h-4 mr-2" />
            {dispatching ? "Dispatching…" : "Dispatch Nearest Unit"}
          </Button>
        )}
        <Button variant="outline" onClick={onClose} className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          Close
        </Button>
      </div>
    </div>
  );
}
