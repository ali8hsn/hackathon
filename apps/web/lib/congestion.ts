import { claudeText } from "@/lib/claude";

const CONGESTION_SYSTEM = `You will receive one roadway still image. Rate how congested the roadway
appears on a scale from 0.0 (empty road) to 1.0 (fully blocked / standstill
traffic). Respond with ONLY a single decimal number. No prose.`;

// In-process cache: cameraId -> { score, expiresAt }
const cache = new Map<string, { score: number; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

/**
 * Deterministic pseudo-random fallback based on camera id + current minute.
 * Ensures the map looks visually varied without real data.
 */
function pseudoRandom(cameraId: string): number {
  const minute = Math.floor(Date.now() / 60_000);
  let hash = 0;
  const s = cameraId + String(minute);
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash % 100) / 100;
}

export async function scoreCamera(
  cameraId: string,
  stillUrl: string
): Promise<number> {
  const now = Date.now();
  const cached = cache.get(cameraId);
  if (cached && cached.expiresAt > now) return cached.score;

  // Fetch still image
  let imageBase64: string | undefined;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(stillUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const buf = await res.arrayBuffer();
      imageBase64 = Buffer.from(buf).toString("base64");
    }
  } catch {
    // Image fetch failed; fall through to fallback
  }

  let score: number;

  if (!imageBase64 || !process.env.ANTHROPIC_API_KEY) {
    score = pseudoRandom(cameraId);
  } else {
    try {
      const text = await claudeText(CONGESTION_SYSTEM, "Rate this roadway image.", imageBase64);
      const parsed = parseFloat(text);
      score = isNaN(parsed) ? pseudoRandom(cameraId) : Math.min(1, Math.max(0, parsed));
    } catch {
      score = pseudoRandom(cameraId);
    }
  }

  cache.set(cameraId, { score, expiresAt: now + CACHE_TTL_MS });
  return score;
}
