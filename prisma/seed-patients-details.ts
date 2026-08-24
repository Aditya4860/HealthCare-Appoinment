import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const ALLERGIES = [
  "Penicillin",
  "Peanuts, Dust mites",
  "Pollen, Latex",
  "Sulfa drugs",
  "None",
  "Seafood",
  "Dairy",
  null // Some patients might not have filled this out
];
const ADDRESSES = [
  "123 Maple Street, Springfield, IL 62704",
  "456 Oak Avenue, Metropolis, NY 10001",
  "789 Pine Road, Gotham, NJ 07001",
  "321 Elm St, Star City, CA 90210",
  "654 Cedar Ln, Central City, OH 43215",
  "987 Birch Blvd, Coast City, FL 33101",
  "111 Walnut Way, Hub City, TX 73301"
];
const EMERGENCY_NAMES = [
  "Robert Brown", "Sarah Connor", "James Smith", "Maria Garcia", 
  "William Davis", "Linda Taylor", "David Wilson", "Patricia Moore"
];

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("🌱 Populating new patient fields for existing patients...");
  
  const patients = await prisma.user.findMany({
    where: { role: "PATIENT" }
  });

  console.log(`Found ${patients.length} patients to update.`);

  let updatedCount = 0;

  for (let i = 0; i < patients.length; i++) {
    const p = patients[i];
    
    // Generate random data
    const dob = getRandomDate(new Date(1950, 0, 1), new Date(2005, 11, 31));
    const phone = `+1-555-${Math.floor(1000 + Math.random() * 9000)}`;
    const ePhone = `+1-555-${Math.floor(1000 + Math.random() * 9000)}`;
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    const bg = BLOOD_GROUPS[Math.floor(Math.random() * BLOOD_GROUPS.length)];
    const allergy = ALLERGIES[Math.floor(Math.random() * ALLERGIES.length)];
    const address = ADDRESSES[Math.floor(Math.random() * ADDRESSES.length)];
    const eName = EMERGENCY_NAMES[Math.floor(Math.random() * EMERGENCY_NAMES.length)];

    await prisma.user.update({
      where: { id: p.id },
      data: {
        phone,
        dateOfBirth: dob,
        gender,
        bloodGroup: bg,
        allergies: allergy,
        address,
        emergencyName: eName,
        emergencyPhone: ePhone,
        isActive: true, // ensure all are active by default
      }
    });
    updatedCount++;
  }

  console.log(`✅ Successfully updated ${updatedCount} patients with sample profile data!`);
}

main()
  .catch((e) => {
    console.error("❌ Failed to update patient details:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
