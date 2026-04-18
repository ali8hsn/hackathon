"use client";

import { formatDistanceToNow } from "date-fns";
import { Flame, Heart, Car, AlertTriangle, HelpCircle } from "lucide-react";
import type { Incident } from "@/components/dashboard/DashboardClient";

const SEVERITY_BORDER: Record<number, string> = {
  1: "border-l-zinc-500",
  2: "border-l-blue-500",
  3: "border-l-amber-400",
  4: "border-l-orange-500",
  5: "border-l-red-500",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  medical: <Heart className="w-4 h-4 text-emerald-400" />,
  fire: <Flame className="w-4 h-4 text-orange-400" />,
  accident: <Car className="w-4 h-4 text-blue-400" />,
  hazmat: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  other: <HelpCircle className="w-4 h-4 text-zinc-400" />,
};

const STATUS_COLORS: Record<string, string> = {
  open: "text-red-400",
  dispatched: "text-amber-400",
  enroute: "text-amber-400",
  onscene: "text-emerald-400",
  closed: "text-zinc-500",
};

interface Props {
  incident: Incident;
  selected: boolean;
  onClick: () => void;
}

export function IncidentCard({ incident, selected, onClick }: Props) {
  const borderColor = SEVERITY_BORDER[incident.severity] ?? "border-l-zinc-500";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left border-l-4 ${borderColor} px-4 py-3 border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/40 focus:outline-none focus:bg-zinc-800/60 ${
        selected ? "bg-zinc-800/60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {TYPE_ICONS[incident.type] ?? TYPE_ICONS.other}
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100 capitalize truncate">
              {incident.type} — Sev {incident.severity}
            </p>
            {incident.description && (
              <p className="text-xs text-zinc-400 truncate">{incident.description}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className={`text-xs font-medium capitalize ${STATUS_COLORS[incident.status] ?? "text-zinc-400"}`}>
            {incident.status}
          </p>
          <p className="text-xs text-zinc-600 tabular-nums">
            {formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      {incident.assignedUnit && (
        <p className="mt-1 text-xs text-indigo-400">
          Unit: {incident.assignedUnit.callsign}
          {incident.eta && ` · ETA ${Math.round(incident.eta / 60)}m`}
        </p>
      )}
    </button>
  );
}
