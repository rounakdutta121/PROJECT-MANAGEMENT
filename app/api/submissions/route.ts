import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const taskId = url.searchParams.get("taskId");

  try {
    let submissions;

    if (session.user.role === "admin") {
      if (taskId) {
        submissions = await prisma.taskSubmission.findMany({
          where: { taskId },
          include: {
            intern: { select: { id: true, name: true, email: true } },
            task: { select: { id: true, title: true } },
          },
          orderBy: { submittedAt: "desc" },
        });
      } else {
        submissions = await prisma.taskSubmission.findMany({
          include: {
            intern: { select: { id: true, name: true, email: true } },
            task: { select: { id: true, title: true } },
          },
          orderBy: { submittedAt: "desc" },
        });
      }
    } else {
      submissions = await prisma.taskSubmission.findMany({
        where: { internId: session.user.id },
        include: {
          task: { select: { id: true, title: true } },
        },
        orderBy: { submittedAt: "desc" },
      });
    }

    return NextResponse.json(submissions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "intern") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { taskId, notes, attachments } = body;

    if (!taskId || !attachments || !Array.isArray(attachments)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const submission = await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: { status: "done" },
      });

      return tx.taskSubmission.create({
        data: {
          taskId,
          internId: session.user.id,
          notes: notes || null,
          attachments,
        },
        include: {
          intern: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 },
    );
  }
}
