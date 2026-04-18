/**
 * Live demo ticker: every 10s nudges dispatched units toward their incident,
 * 5% chance to spawn a random incident.
 * Run: npx tsx scripts/demo_tick.ts
 */
import { db } from "../lib/db";

const INCIDENT_TYPES = ["fire", "medical", "police"] as const;
const AUSTIN_CENTER = { lat: 30.2672, lng: -97.7431 };
const RADIUS_DEG = 0.05;

function randInRange(center: number, radius: number) {
  return center + (Math.random() - 0.5) * 2 * radius;
}

async function nudgeUnits() {
  const incidents = await db.incident.findMany({
    where: { status: "dispatched" },
    include: { assignedUnit: true },
  });

  for (const inc of incidents) {
    if (!inc.assignedUnit) continue;
    const unit = inc.assignedUnit;
    // Move 2% toward incident each tick
    const newLat = unit.lat + (inc.lat - unit.lat) * 0.08;
    const newLng = unit.lng + (inc.lng - unit.lng) * 0.08;
    const dist = Math.sqrt((newLat - inc.lat) ** 2 + (newLng - inc.lng) ** 2);

    if (dist < 0.0005) {
      // Arrived — mark on_scene
      await db.unit.update({ where: { id: unit.id }, data: { lat: inc.lat, lng: inc.lng, status: "on_scene" } });
      await db.incident.update({ where: { id: inc.id }, data: { status: "on_scene" } });
      console.log(`Unit ${unit.callsign} arrived at incident ${inc.id.slice(0, 8)}`);
    } else {
      await db.unit.update({ where: { id: unit.id }, data: { lat: newLat, lng: newLng } });
    }
  }
}

async function maybeSpawnIncident() {
  if (Math.random() > 0.05) return;
  const type = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)]!;
  const severity = Math.floor(Math.random() * 3) + 1;
  const lat = randInRange(AUSTIN_CENTER.lat, RADIUS_DEG);
  const lng = randInRange(AUSTIN_CENTER.lng, RADIUS_DEG);

  const inc = await db.incident.create({
    data: {
      type,
      severity,
      lat,
      lng,
      description: `Auto-generated ${type} incident for demo`,
      reporterKind: "citizen",
    },
  });
  console.log(`Spawned ${type} Sev${severity} incident ${inc.id.slice(0, 8)}`);
}

async function tick() {
  await nudgeUnits();
  await maybeSpawnIncident();
}

console.log("Demo ticker running — Ctrl+C to stop");
void tick();
setInterval(() => void tick(), 10_000);
