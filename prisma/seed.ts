import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await hash("admin123", 12);
  const internPassword = await hash("intern123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "admin",
    },
  });

  const intern1 = await prisma.user.create({
    data: {
      name: "Alice Intern",
      email: "alice@example.com",
      password: internPassword,
      role: "intern",
      assignedTasks: {
        create: [
          {
            title: "Setup development environment",
            description: "Install required tools and dependencies",
            status: "done",
            deadline: new Date("2026-05-15"),
          },
          {
            title: "Review project documentation",
            description: "Read through API docs and architecture",
            status: "in_progress",
            deadline: new Date("2026-05-20"),
          },
        ],
      },
    },
  });

  const intern2 = await prisma.user.create({
    data: {
      name: "Bob Intern",
      email: "bob@example.com",
      password: internPassword,
      role: "intern",
      assignedTasks: {
        create: [
          {
            title: "Write unit tests",
            description: "Add test coverage for API routes",
            status: "pending",
            deadline: new Date("2026-05-25"),
          },
        ],
      },
    },
  });

  console.log("Seeded users:");
  console.log(`  Admin:  ${admin.name} (${admin.email})`);
  console.log(`  Intern: ${intern1.name} (${intern1.email})`);
  console.log(`  Intern: ${intern2.name} (${intern2.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
