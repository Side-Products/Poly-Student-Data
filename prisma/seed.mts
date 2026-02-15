import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "dev.db");

const { PrismaClient } = await import("../src/generated/prisma/client.ts");

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@pharmacy.edu" },
    update: {},
    create: {
      email: "admin@pharmacy.edu",
      password: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  const subjects = [
    { paperCode: "162011", name: "Pharmaceutics", shortName: "Pharma", year: "FIRST_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162012", name: "Pharmaceutical Chemistry", shortName: "P Chem", year: "FIRST_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162013", name: "Pharmacognosy", shortName: "Pharmacognosy", year: "FIRST_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162014", name: "Human Anatomy and Physiology", shortName: "HAP", year: "FIRST_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162015", name: "Social Pharmacy", shortName: "SP", year: "FIRST_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162052", name: "Games", shortName: "Games", year: "FIRST_YEAR", hasTheory: false, hasPractical: false, isFixedMarks: true },
    { paperCode: "162053", name: "Discipline", shortName: "Discipline", year: "FIRST_YEAR", hasTheory: false, hasPractical: false, isFixedMarks: true },
    { paperCode: "162021", name: "Pharmacology", shortName: "Pharmacology", year: "SECOND_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162022", name: "Community Pharmacy & Management", shortName: "CPM", year: "SECOND_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162023", name: "Biochemistry & Clinical Pathology", shortName: "BCP", year: "SECOND_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162024", name: "Pharmacotherapeutics", shortName: "Pharma-T", year: "SECOND_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162025", name: "Hospital & Clinical Pharmacy", shortName: "HCP", year: "SECOND_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162026", name: "Pharmacy Law & Ethics", shortName: "PLE", year: "SECOND_YEAR", hasTheory: true, hasPractical: true, isFixedMarks: false },
    { paperCode: "162052", name: "Games", shortName: "Games", year: "SECOND_YEAR", hasTheory: false, hasPractical: false, isFixedMarks: true },
    { paperCode: "162053", name: "Discipline", shortName: "Discipline", year: "SECOND_YEAR", hasTheory: false, hasPractical: false, isFixedMarks: true },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { paperCode_year: { paperCode: subject.paperCode, year: subject.year } },
      update: subject,
      create: subject,
    });
  }

  console.log("Seed completed: Admin user and subjects created.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
