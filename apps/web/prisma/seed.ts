import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { fetchCameras } from "../lib/austin";

function resolveDbFileUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) return raw;
  const filePath = raw.slice("file:".length);
  if (path.isAbsolute(filePath)) return raw;
  const abs = path.resolve(process.cwd(), filePath);
  return `file:${abs}`;
}

const adapter = new PrismaBetterSqlite3({ url: resolveDbFileUrl() });
// reason: Prisma 7 requires adapter for SQLite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient({ adapter: adapter as any });

const UNITS = [
  { callsign: "E1", kind: "engine", lat: 30.2672, lng: -97.7431 },
  { callsign: "E2", kind: "engine", lat: 30.3150, lng: -97.7320 },
  { callsign: "E3", kind: "engine", lat: 30.2400, lng: -97.7800 },
  { callsign: "E4", kind: "engine", lat: 30.3600, lng: -97.7150 },
  { callsign: "E5", kind: "engine", lat: 30.2100, lng: -97.7500 },
  { callsign: "M1", kind: "medic", lat: 30.2750, lng: -97.7490 },
  { callsign: "M2", kind: "medic", lat: 30.3050, lng: -97.7200 },
  { callsign: "M3", kind: "medic", lat: 30.2500, lng: -97.7650 },
  { callsign: "M4", kind: "medic", lat: 30.3500, lng: -97.7450 },
  { callsign: "P1", kind: "police", lat: 30.2680, lng: -97.7300 },
  { callsign: "P2", kind: "police", lat: 30.2900, lng: -97.7600 },
  { callsign: "P3", kind: "police", lat: 30.3200, lng: -97.7050 },
];

const SEED_INCIDENTS = [
  {
    type: "medical",
    severity: 5,
    lat: 30.2784,
    lng: -97.7551,
    description: "Cardiac arrest reported — person unresponsive",
    address: "2nd St & Lavaca, Austin TX",
  },
  {
    type: "fire",
    severity: 4,
    lat: 30.3025,
    lng: -97.7214,
    description: "Structure fire, smoke visible from two floors",
    address: "Airport Blvd & Manor Rd, Austin TX",
  },
  {
    type: "accident",
    severity: 3,
    lat: 30.2460,
    lng: -97.7812,
    description: "Multi-vehicle collision, injuries reported",
    address: "S MoPac & Barton Springs, Austin TX",
  },
];

async function main() {
  console.log("Seeding database…");

  // Units
  for (const unit of UNITS) {
    await db.unit.upsert({
      where: { callsign: unit.callsign },
      update: {},
      create: unit,
    });
  }
  console.log(`  ${UNITS.length} units seeded`);

  // Clear and re-seed incidents
  const existingCount = await db.incident.count();
  if (existingCount === 0) {
    for (const inc of SEED_INCIDENTS) {
      await db.incident.create({ data: inc });
    }
    console.log(`  ${SEED_INCIDENTS.length} incidents seeded`);
  } else {
    console.log(`  ${existingCount} incidents already present`);
  }

  // Cameras
  const existingCams = await db.camera.count();
  if (existingCams === 0) {
    const cameras = await fetchCameras();
    for (const c of cameras) {
      await db.camera.upsert({
        where: { id: c.id },
        update: {},
        create: { id: c.id, name: c.name, lat: c.lat, lng: c.lng, stillUrl: c.stillUrl },
      });
    }
    console.log(`  ${cameras.length} cameras seeded`);
  } else {
    console.log(`  ${existingCams} cameras already present`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
