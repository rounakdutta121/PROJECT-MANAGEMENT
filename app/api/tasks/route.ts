import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendTaskAssignedEmail } from "@/lib/email";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["pending", "in_progress", "done"]).default("pending"),
  deadline: z.coerce.date().optional(),
  assignedToId: z.string().uuid(),
  attachments: z
    .array(
      z.object({
        url: z.string(),
        public_id: z.string(),
        resource_type: z.string(),
        name: z.string(),
        size: z.number(),
      }),
    )
    .optional(),
});

export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let where = {};

  if (session.user.role === "intern") {
    where = { assignedToId: session.user.id };
  }

  try {
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createTaskSchema.parse(body);

    const task = await prisma.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        deadline: validated.deadline ?? null,
        assignedToId: validated.assignedToId,
        ...(validated.attachments && { attachments: validated.attachments }),
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (task.assignedTo) {
      console.log("Triggering email to:", task.assignedTo.email);

      sendTaskAssignedEmail({
        to: task.assignedTo.email,
        taskTitle: task.title,
        taskDescription: task.description || undefined,
        deadline: validated.deadline
          ? validated.deadline.toISOString()
          : new Date().toISOString(),
        assignedByName: session.user.name,
        appUrl: process.env.APP_URL || "http://localhost:3000",
      }).catch((err) => {
        console.error("Email failed:", err);
      });
    } else {
      console.log("No email sent: task has no assigned user");
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Task creation error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
