"use client";

import { useEffect, useRef } from "react";
import type { Camera } from "@/components/dashboard/DashboardClient";

interface Props {
  camera: Camera;
  position: { x: number; y: number };
  onClose: () => void;
}

export function CameraPopover({ camera, position, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const congestion = camera.lastCongestion ?? null;
  const congestionColor =
    congestion === null ? "text-zinc-400"
    : congestion > 0.6 ? "text-red-400"
    : congestion > 0.3 ? "text-amber-400"
    : "text-emerald-400";

  const congestionLabel =
    congestion === null ? "Unknown"
    : congestion > 0.6 ? "Congested"
    : congestion > 0.3 ? "Moderate"
    : "Clear";

  // Clamp to viewport
  const left = Math.min(position.x, window.innerWidth - 340);
  const top = Math.min(position.y, window.innerHeight - 280);

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
      style={{ left, top, width: 320 }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{camera.name}</p>
          <p className="text-xs text-zinc-500">{camera.id}</p>
        </div>
        <div className={`text-xs font-medium ${congestionColor}`}>
          {congestionLabel}
          {congestion !== null && ` (${(congestion * 100).toFixed(0)}%)`}
        </div>
      </div>

      {/* Still image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/cameras/${camera.id}/still`}
        alt={`Camera ${camera.name}`}
        className="w-full h-48 object-cover bg-zinc-800"
        loading="lazy"
      />

      <div className="px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}
        </span>
        <button
          onClick={onClose}
          className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
