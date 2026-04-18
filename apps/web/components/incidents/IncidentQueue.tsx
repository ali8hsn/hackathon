"use client";

import { IncidentCard } from "@/components/incidents/IncidentCard";
import type { Incident } from "@/components/dashboard/DashboardClient";

interface Props {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function IncidentQueue({ incidents, selectedId, onSelect }: Props) {
  const open = incidents.filter((i) => i.status !== "closed");
  const closed = incidents.filter((i) => i.status === "closed");

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-300 uppercase">Incidents</h2>
        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">
          {open.length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {open.length === 0 && (
          <div className="p-6 text-center text-zinc-600 text-sm">
            No active incidents
          </div>
        )}
        {open.map((inc) => (
          <IncidentCard
            key={inc.id}
            incident={inc}
            selected={inc.id === selectedId}
            onClick={() => onSelect(inc.id)}
          />
        ))}

        {closed.length > 0 && (
          <>
            <div className="px-4 py-2 text-xs text-zinc-600 uppercase tracking-wider border-t border-zinc-800/50">
              Closed ({closed.length})
            </div>
            {closed.slice(0, 5).map((inc) => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                selected={inc.id === selectedId}
                onClick={() => onSelect(inc.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
