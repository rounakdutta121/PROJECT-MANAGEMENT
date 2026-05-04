import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { status, feedback, reopen } = body;

    const existing = await prisma.taskSubmission.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    if (reopen) {
      const updated = await prisma.$transaction(
        async (tx) => {
          const submission = await tx.taskSubmission.update({
            where: { id: params.id },
            data: {
              status: "needs-revision",
              feedback: feedback ?? existing.feedback,
            },
            include: {
              intern: { select: { id: true, name: true, email: true } },
              task: true,
            },
          });

          await tx.task.update({
            where: { id: submission.taskId },
            data: {
              status: "in_progress",
              reopenedAt: new Date(),
            },
          });

          return submission;
        },
        { timeout: 30000 },
      );

      return NextResponse.json(updated);
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        const submission = await tx.taskSubmission.update({
          where: { id: params.id },
          data: {
            status: status ?? existing.status,
            feedback: feedback ?? existing.feedback,
          },
          include: {
            intern: { select: { id: true, name: true, email: true } },
            task: true,
          },
        });

        if (submission.status === "approved") {
          await tx.task.update({
            where: { id: submission.taskId },
            data: { status: "done" },
          });
        }

        return submission;
      },
      { timeout: 30000 },
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update submission error:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 },
    );
  }
}
