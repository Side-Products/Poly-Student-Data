"use server";

import { prisma } from "@/lib/prisma";
import {
  calculateTheorySessional,
  calculatePracticalSessional,
  calculateSubjectResult,
  calculateOverallResult,
  type SubjectResult,
  type ResultSummary,
} from "@/lib/result-calculator";

export async function calculateStudentResult(studentId: string): Promise<ResultSummary> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { yearSemester: true },
  });

  if (!student) throw new Error("Student not found");

  const subjects = await prisma.subject.findMany({
    where: { year: student.yearSemester },
    orderBy: { paperCode: "asc" },
  });

  const [sessionalMarks, boardMarks, fixedMarks] = await Promise.all([
    prisma.sessionalMark.findMany({ where: { studentId } }),
    prisma.boardMark.findMany({ where: { studentId } }),
    prisma.fixedMark.findMany({ where: { studentId } }),
  ]);

  const subjectResults: SubjectResult[] = subjects.map((subject) => {
    if (subject.isFixedMarks) {
      const fixed = fixedMarks.find((f) => f.subjectId === subject.id);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        paperCode: subject.paperCode,
        theorySessional: null,
        theoryBoard: null,
        theoryTotal: null,
        practicalSessional: null,
        practicalBoard: null,
        practicalTotal: null,
        grandTotal: fixed?.marks ?? null,
        status: "PASS" as const,
        isFixedMarks: true,
        fixedMarks: fixed?.marks ?? null,
      };
    }

    const theorySessional = sessionalMarks.find(
      (m) => m.subjectId === subject.id && m.type === "THEORY"
    );
    const practicalSessional = sessionalMarks.find(
      (m) => m.subjectId === subject.id && m.type === "PRACTICAL"
    );
    const board = boardMarks.find((m) => m.subjectId === subject.id);

    const theorySessionalScore = theorySessional
      ? calculateTheorySessional(theorySessional)
      : null;
    const practicalSessionalScore = practicalSessional
      ? calculatePracticalSessional(practicalSessional)
      : null;

    const { theoryTotal, practicalTotal, grandTotal, status } = calculateSubjectResult(
      theorySessionalScore,
      board?.theoryMarks ?? null,
      practicalSessionalScore,
      board?.practicalMarks ?? null
    );

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      paperCode: subject.paperCode,
      theorySessional: theorySessionalScore,
      theoryBoard: board?.theoryMarks ?? null,
      theoryTotal,
      practicalSessional: practicalSessionalScore,
      practicalBoard: board?.practicalMarks ?? null,
      practicalTotal,
      grandTotal,
      status,
      isFixedMarks: false,
      fixedMarks: null,
    };
  });

  const { overallResult, backPaperCount } = calculateOverallResult(subjectResults);

  const gradedSubjects = subjectResults.filter((s) => !s.isFixedMarks);
  const totalMarksObtained = gradedSubjects.reduce((sum, s) => sum + (s.grandTotal ?? 0), 0);
  const totalMaxMarks = gradedSubjects.length * 200; // Each subject: theory 100 + practical 100
  const percentage = totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

  return {
    subjects: subjectResults,
    overallResult,
    totalMarksObtained,
    totalMaxMarks,
    percentage: Math.round(percentage * 100) / 100,
    backPaperCount,
  };
}
