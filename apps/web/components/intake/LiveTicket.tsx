"use client";

import { useEffect, useState } from "react";
import type { IncidentTicket } from "@/lib/types";
import { PhoneCall } from "lucide-react";

interface IntakeSession {
  id: string;
  startedAt: string;
  transcript: string;
  ticket: string;
  status: string;
  lat?: number | null;
  lng?: number | null;
}

interface LiveCall {
  session: IntakeSession;
  ticket: IncidentTicket | null;
}

export function LiveTicket() {
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchSessions = async () => {
      try {
        const res = await fetch("/api/intake/sessions");
        if (!res.ok || !mounted) return;
        const sessions: IntakeSession[] = await res.json();
        const calls: LiveCall[] = sessions.map((s) => {
          let ticket: IncidentTicket | null = null;
          try {
            ticket = JSON.parse(s.ticket || "{}") as IncidentTicket;
            if (!ticket.type) ticket = null;
          } catch {
            ticket = null;
          }
          return { session: s, ticket };
        });
        setLiveCalls(calls);
      } catch {
        // Keep stale data
      }
    };

    void fetchSessions();
    const interval = setInterval(() => void fetchSessions(), 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (liveCalls.length === 0) return null;

  return (
    <div className="border-b border-zinc-800">
      <div className="px-4 py-2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Live Calls ({liveCalls.length})
        </span>
      </div>
      <div className="flex flex-col gap-0">
        {liveCalls.map(({ session, ticket }) => (
          <div
            key={session.id}
            className="px-4 py-2.5 border-t border-zinc-800/50 flex items-start gap-3 hover:bg-zinc-800/30 transition-colors"
          >
            <div className="mt-0.5">
              <PhoneCall className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                {ticket?.severity && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-300 font-medium">
                    Sev {ticket.severity}
                  </span>
                )}
                {ticket?.type && ticket.type !== "unknown" && (
                  <span className="text-xs text-zinc-400 capitalize">{ticket.type}</span>
                )}
                <span className="text-xs text-zinc-600 ml-auto font-mono">
                  {session.id.slice(0, 8)}…
                </span>
              </div>
              {ticket?.summary ? (
                <p className="text-xs text-zinc-300 truncate">{ticket.summary}</p>
              ) : (
                <p className="text-xs text-zinc-500 italic">Gathering information…</p>
              )}
              {ticket?.life_safety_flags && ticket.life_safety_flags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {ticket.life_safety_flags.slice(0, 3).map((flag) => (
                    <span key={flag} className="text-[10px] px-1 py-0.5 rounded bg-red-900/40 text-red-300 font-medium">
                      {flag.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
