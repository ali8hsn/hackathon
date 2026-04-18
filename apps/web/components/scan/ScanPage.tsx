"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";
import type { ScanMode, ScanResult } from "@/lib/types";

const MODES: ScanMode[] = ["medical", "fire", "accident", "general"];

const MODE_LABELS: Record<ScanMode, string> = {
  medical: "Medical",
  fire: "Fire",
  accident: "Accident",
  general: "General",
};

export function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mode, setMode] = useState<ScanMode>("medical");
  const [active, setActive] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const lastSpokenRef = useRef(0);
  const lastSpokenTextRef = useRef("");

  const speak = useCallback((text: string) => {
    const now = Date.now();
    if (now - lastSpokenRef.current < 5000) return;
    if (text === lastSpokenTextRef.current) return;
    lastSpokenRef.current = now;
    lastSpokenTextRef.current = text;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9;
    window.speechSynthesis.speak(utt);
  }, []);

  const captureAndScan = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.readyState) return;

    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 512, 512);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    const base64 = dataUrl.split(",")[1];
    if (!base64) return;

    setScanning(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mode }),
      });
      if (res.ok) {
        const data = (await res.json()) as ScanResult;
        setResult(data);
        speak(data.actions[0]);
      }
    } catch {
      // Keep last result
    } finally {
      setScanning(false);
    }
  }, [mode, speak]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      scanTimerRef.current = setInterval(() => void captureAndScan(), 2000);
    } catch {
      alert("Camera permission denied.");
    }
  }, [captureAndScan]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    setActive(false);
    setResult(null);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col text-white">
      {/* Mode tabs */}
      <div className="flex border-b border-zinc-800">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-3 text-sm font-medium transition-colors focus:outline-none ${
              mode === m
                ? "text-white border-b-2 border-blue-500 bg-zinc-900"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Camera view */}
      <div className="relative flex-1 bg-black">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950">
            <p className="text-zinc-400 text-sm text-center px-8">
              Point your camera at the scene for AI-powered guidance.
            </p>
            <button
              onClick={startCamera}
              className="w-48 py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-bold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Start Scan
            </button>
          </div>
        )}

        {active && scanning && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-xs text-zinc-300">Analyzing…</span>
          </div>
        )}
      </div>

      {/* Action cards */}
      <div className="flex-shrink-0 bg-zinc-950 p-4 space-y-3">
        <AnimatePresence>
          {result ? (
            <>
              <p className="text-xs text-zinc-500 text-center">{result.summary}</p>
              {result.actions.map((action, i) => (
                <motion.div
                  key={`${action}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center gap-3 p-4 rounded-xl ${
                    i === 0
                      ? "bg-red-500/10 border border-red-500/30"
                      : i === 1
                      ? "bg-amber-500/10 border border-amber-500/30"
                      : "bg-zinc-800 border border-zinc-700"
                  }`}
                >
                  <span className={`text-2xl font-bold tabular-nums ${i === 0 ? "text-red-400" : i === 1 ? "text-amber-400" : "text-zinc-400"}`}>
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm font-medium text-white">{action}</p>
                  {i === 0 && (
                    <button
                      onClick={() => speak(action)}
                      className="text-zinc-400 hover:text-white focus:outline-none"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </>
          ) : active ? (
            <div className="text-center text-zinc-500 text-sm py-4">
              Analyzing scene…
            </div>
          ) : null}
        </AnimatePresence>

        {active && (
          <button
            onClick={stopCamera}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-colors mt-2"
          >
            Stop Scan
          </button>
        )}
      </div>
    </div>
  );
}
