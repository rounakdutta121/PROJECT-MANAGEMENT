import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Resetting database...");

  // Delete in correct order to respect foreign keys
  await prisma.taskSubmission.deleteMany();
  console.log("✓ Deleted all task submissions");

  await prisma.task.deleteMany();
  console.log("✓ Deleted all tasks");

  await prisma.user.deleteMany();
  console.log("✓ Deleted all users");

  console.log("Database reset complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
