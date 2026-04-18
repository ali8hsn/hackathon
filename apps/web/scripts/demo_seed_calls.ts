/**
 * Seeds three in-flight intake sessions for demo purposes.
 * Run: npx tsx scripts/demo_seed_calls.ts
 */
import { db } from "../lib/db";

const DEMO_CALLS = [
  {
    transcript: "Caller: There's a fire at the corner of 6th and Congress. Flames are coming out of the second floor window. Dispatcher: Is anyone trapped inside? Caller: I think there's people up there, yes.",
    ticket: JSON.stringify({
      type: "fire",
      severity: 1,
      summary: "Structure fire at 6th & Congress Ave, possible entrapment",
      life_safety_flags: ["entrapment", "active_fire"],
      address: "6th St & Congress Ave, Austin TX",
      lat: 30.2672,
      lng: -97.7431,
    }),
    status: "intake",
    lat: 30.2672,
    lng: -97.7431,
  },
  {
    transcript: "Caller: Someone just got hit by a car on South Lamar. They're not moving. Dispatcher: Are they breathing? Caller: I think so but there's blood.",
    ticket: JSON.stringify({
      type: "medical",
      severity: 2,
      summary: "Pedestrian struck by vehicle on S Lamar Blvd, unconscious",
      life_safety_flags: ["unconscious", "trauma"],
      address: "S Lamar Blvd & Barton Springs Rd, Austin TX",
      lat: 30.2603,
      lng: -97.7687,
    }),
    status: "intake",
    lat: 30.2603,
    lng: -97.7687,
  },
  {
    transcript: "Caller: There's a robbery in progress at the convenience store on East 7th. Two guys with guns.",
    ticket: JSON.stringify({
      type: "police",
      severity: 2,
      summary: "Armed robbery in progress at E 7th St convenience store",
      life_safety_flags: ["armed_suspects"],
      address: "E 7th St, Austin TX",
      lat: 30.2634,
      lng: -97.7248,
    }),
    status: "intake",
    lat: 30.2634,
    lng: -97.7248,
  },
];

async function main() {
  // Remove existing demo sessions
  await db.intakeSession.deleteMany({ where: { status: "intake" } });

  for (const call of DEMO_CALLS) {
    await db.intakeSession.create({ data: call });
  }
  console.log(`Seeded ${DEMO_CALLS.length} demo intake sessions`);
}

main()
  .catch(console.error)
  .finally(() => void db.$disconnect());
