"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function upsertSessionalMarks(data: {
  studentId: string;
  subjectId: string;
  type: "THEORY" | "PRACTICAL";
  sessional1?: string | null;
  sessional2?: string | null;
  sessional3?: string | null;
  assignmentMarks?: string | null;
  fieldVisitMarks?: string | null;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.sessionalMark.upsert({
    where: {
      studentId_subjectId_type: {
        studentId: data.studentId,
        subjectId: data.subjectId,
        type: data.type,
      },
    },
    update: {
      sessional1: data.sessional1,
      sessional2: data.sessional2,
      sessional3: data.sessional3,
      assignmentMarks: data.assignmentMarks,
      fieldVisitMarks: data.fieldVisitMarks,
    },
    create: data,
  });

  revalidatePath(`/students/${data.studentId}/marks`);
  return { success: true };
}

export async function upsertBoardMarks(data: {
  studentId: string;
  subjectId: string;
  theoryMarks?: string | null;
  practicalMarks?: string | null;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.boardMark.upsert({
    where: {
      studentId_subjectId: {
        studentId: data.studentId,
        subjectId: data.subjectId,
      },
    },
    update: {
      theoryMarks: data.theoryMarks,
      practicalMarks: data.practicalMarks,
    },
    create: data,
  });

  revalidatePath(`/students/${data.studentId}/marks`);
  return { success: true };
}

export async function upsertFixedMarks(data: {
  studentId: string;
  subjectId: string;
  marks: string | null;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.fixedMark.upsert({
    where: {
      studentId_subjectId: {
        studentId: data.studentId,
        subjectId: data.subjectId,
      },
    },
    update: { marks: data.marks },
    create: data,
  });

  revalidatePath(`/students/${data.studentId}/marks`);
  return { success: true };
}

export async function getStudentMarks(studentId: string) {
  const [sessionalMarks, boardMarks, fixedMarks, subjects] = await Promise.all([
    prisma.sessionalMark.findMany({
      where: { studentId },
      include: { subject: true },
    }),
    prisma.boardMark.findMany({
      where: { studentId },
      include: { subject: true },
    }),
    prisma.fixedMark.findMany({
      where: { studentId },
      include: { subject: true },
    }),
    prisma.subject.findMany({
      orderBy: { paperCode: "asc" },
    }),
  ]);

  return { sessionalMarks, boardMarks, fixedMarks, subjects };
}

export async function getSubjectsForYear(year: string) {
  return prisma.subject.findMany({
    where: { year },
    orderBy: { paperCode: "asc" },
  });
}
