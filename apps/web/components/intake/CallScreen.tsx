"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { IncidentTicket } from "@/lib/types";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export function CallScreen() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [ticket, setTicket] = useState<IncidentTicket | null>(null);
  const [aiQuestion, setAiQuestion] = useState<string>("SIREN is ready. Tell me what happened.");
  const [finished, setFinished] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingDeltaRef = useRef("");
  const lastSpokenRef = useRef(0);

  const speak = useCallback((text: string) => {
    const now = Date.now();
    if (now - lastSpokenRef.current < 3000) return;
    lastSpokenRef.current = now;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.85;
    utt.pitch = 1;
    window.speechSynthesis.speak(utt);
  }, []);

  const sendChunk = useCallback(async (delta: string) => {
    if (!sessionId || !delta.trim()) return;
    try {
      const res = await fetch("/api/intake/chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, transcriptDelta: delta }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { ticket: IncidentTicket; aiFollowUp?: string };
      setTicket(data.ticket);
      if (data.aiFollowUp) {
        setAiQuestion(data.aiFollowUp);
        speak(data.aiFollowUp);
      }
    } catch {
      // Ignore network errors; continue
    }
  }, [sessionId, speak]);

  const startCall = useCallback(async () => {
    let lat: number | undefined;
    let lng: number | undefined;

    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      // GPS denied; continue without
    }

    const res = await fetch("/api/intake/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng }),
    });
    const data = (await res.json()) as { sessionId: string };
    setSessionId(data.sessionId);

    // Start speech recognition
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) {
      setAiQuestion("Speech recognition unavailable. Please type your emergency.");
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let newDelta = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newDelta += event.results[i][0].transcript + " ";
        }
      }
      if (newDelta) {
        setTranscript((t) => t + newDelta);
        pendingDeltaRef.current += newDelta;
      }
    };

    recognition.onerror = () => { /* ignore */ };
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);

    speak("SIREN here. Stay with me. Tell me what happened.");

    // Send chunks every 1s
    chunkTimerRef.current = setInterval(() => {
      const delta = pendingDeltaRef.current;
      if (delta) {
        pendingDeltaRef.current = "";
        void sendChunk(delta);
      }
    }, 1000);
  }, [speak, sendChunk]);

  const finishCall = useCallback(async () => {
    if (!sessionId) return;
    recognitionRef.current?.stop();
    if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    setListening(false);

    const res = await fetch("/api/intake/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    await res.json();
    setFinished(true);
    speak("Help is on the way. Stay on the line.");
  }, [sessionId, speak]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (chunkTimerRef.current) clearInterval(chunkTimerRef.current);
    };
  }, []);

  if (finished) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Help is on the way</h1>
        <p className="text-zinc-500">Your information has been sent to the dispatcher. Stay calm and stay on the line.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* AI Question Banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={aiQuestion}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-indigo-600 px-6 py-4 text-center"
        >
          <p className="text-white text-lg font-medium leading-snug">{aiQuestion}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
        {/* Pulsing circle */}
        {!sessionId ? (
          <button
            onClick={startCall}
            className="relative focus:outline-none"
          >
            <div className="w-40 h-40 bg-red-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-2xl hover:bg-red-600 transition-colors">
              TAP TO CALL
            </div>
          </button>
        ) : (
          <div className="relative">
            <motion.div
              animate={listening ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-40 h-40 bg-blue-500/20 rounded-full absolute -inset-4"
            />
            <div className="w-40 h-40 bg-blue-600 rounded-full flex items-center justify-center text-white relative z-10 shadow-2xl">
              <div className="text-center">
                <div className="text-3xl mb-1">🎙</div>
                <div className="text-sm font-medium">Listening</div>
              </div>
            </div>
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Transcript</p>
            <p className="text-sm text-zinc-200 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Ticket preview */}
        {ticket && (
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Live Ticket</p>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 capitalize">{ticket.type}</span>
              {ticket.severity && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-300">Sev {ticket.severity}</span>
              )}
              <span className="text-xs text-zinc-500 ml-auto">{(ticket.confidence * 100).toFixed(0)}% confident</span>
            </div>
            {ticket.summary && <p className="text-sm text-zinc-200">{ticket.summary}</p>}
          </div>
        )}

        {sessionId && (
          <button
            onClick={finishCall}
            className="w-full max-w-md py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Done — Send to Dispatcher
          </button>
        )}
      </div>
    </div>
  );
}
