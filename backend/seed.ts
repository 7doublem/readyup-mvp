// Database seed script
// Populates Firestore with test data so the app can be demoed immediately.
// Inserts 5 upcoming gaming events. Run via: npm run seed (from root)
//
// Prerequisites:
// A Firebase service account key at the path specified in .env
// The backend .env file with GOOGLE_APPLICATION_CREDENTIALS set

import "dotenv/config";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Loads the service account key from the path specified in .env
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccountPath) {
  console.error("Missing GOOGLE_APPLICATION_CREDENTIALS in .env");
  process.exit(1);
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require(serviceAccountPath);

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();

// Deletes all documents in a collection
async function clearCollection(collectionName: string): Promise<void> {
  const snapshot = await db.collection(collectionName).get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`  Cleared ${snapshot.size} docs from "${collectionName}"`);
}

async function seed() {
  console.log("\nStarting seed...\n");

  // Clear existing data
  console.log("Clearing existing data...");
  await clearCollection("events");

  // Use an existing staff member as the creator for seeded events
  const staffSnapshot = await db
    .collection("users")
    .where("role", "==", "staff")
    .limit(1)
    .get();

  if (staffSnapshot.empty) {
    console.error(
      "No staff user found in the users collection. Create a staff user before running seed."
    );
    process.exit(1);
  }

  const staffUid = staffSnapshot.docs[0].id;

  // Create events referencing the staff user
  console.log("\nCreating events...");

  // Returns a future date offset by a given number of days
  const futureDate = (daysFromNow: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  // Each event has: title, game, description, location, date, prizePool,
  // entryFee (0 = free), maxParticipants, attendees (starts empty),
  // status ("upcoming"), createdBy (staff UID), and createdAt (server time)
  const events = [
    {
      title: "Apex Legends Solo Queue",
      game: "Apex Legends",
      description: "Prove your worth in a solo queue ranked grind. Top fraggers take the pot.",
      location: "Online - EU Servers",
      date: futureDate(3),
      prizePool: 250,
      entryFee: 5,
      maxParticipants: 20,
      attendees: [],
      status: "upcoming",
      createdBy: staffUid,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      title: "Valorant 1v1 Showdown",
      game: "Valorant",
      description: "Single elimination 1v1 duels on Ascent. No abilities, gunplay only.",
      location: "Online - NA Servers",
      date: futureDate(5),
      prizePool: 500,
      entryFee: 10,
      maxParticipants: 20,
      attendees: [],
      status: "upcoming",
      createdBy: staffUid,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      title: "Fortnite Zero Build Arena",
      game: "Fortnite",
      description: "Zero build solo arena. Placement points and eliminations both count.",
      location: "Online - EU Servers",
      date: futureDate(7),
      prizePool: 300,
      entryFee: 0,
      maxParticipants: 20,
      attendees: [],
      status: "upcoming",
      createdBy: staffUid,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      title: "Call of Duty: Warzone Kill Race",
      game: "Call of Duty: Warzone",
      description: "3-game kill race across Urzikstan. Highest total kills wins.",
      location: "Online - NA Servers",
      date: futureDate(10),
      prizePool: 750,
      entryFee: 15,
      maxParticipants: 20,
      attendees: [],
      status: "upcoming",
      createdBy: staffUid,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      title: "Rocket League 1v1 Tournament",
      game: "Rocket League",
      description: "Best of 3 bracket. All ranks welcome, but no mercy given.",
      location: "Online - EU Servers",
      date: futureDate(14),
      prizePool: 200,
      entryFee: 0,
      maxParticipants: 20,
      attendees: [],
      status: "upcoming",
      createdBy: staffUid,
      createdAt: FieldValue.serverTimestamp(),
    },
  ];

  for (const event of events) {
    const ref = await db.collection("events").add(event);
    console.log(`  Created event: "${event.title}" (${ref.id})`);
  }

  console.log("\nSeed complete!\n");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
