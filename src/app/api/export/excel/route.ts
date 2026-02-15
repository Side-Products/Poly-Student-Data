import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";
import {
  calculateTheorySessional,
  calculatePracticalSessional,
  calculateSubjectResult,
  calculateOverallResult,
  type SubjectResult,
} from "@/lib/result-calculator";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (
      !session?.user ||
      (session.user as { role: string }).role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const year = searchParams.get("year");

    if (!type || !year) {
      return NextResponse.json(
        { error: "Missing required parameters: type and year" },
        { status: 400 }
      );
    }

    if (!["students", "results"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'students' or 'results'" },
        { status: 400 }
      );
    }

    if (!["FIRST_YEAR", "SECOND_YEAR"].includes(year)) {
      return NextResponse.json(
        { error: "Invalid year. Must be 'FIRST_YEAR' or 'SECOND_YEAR'" },
        { status: 400 }
      );
    }

    if (type === "students") {
      return await exportStudentData(year);
    } else {
      return await exportResultsData(year);
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function exportStudentData(year: string) {
  const students = await prisma.student.findMany({
    where: { yearSemester: year },
    orderBy: { registrationNumber: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Poly Student Data";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Students");

  // Define columns
  worksheet.columns = [
    { header: "S.No.", key: "sno", width: 8 },
    { header: "Registration Number", key: "registrationNumber", width: 22 },
    { header: "Roll Number", key: "rollNumber", width: 16 },
    { header: "Name", key: "name", width: 28 },
    { header: "Father's Name", key: "fatherName", width: 28 },
    { header: "Year", key: "year", width: 14 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Category", key: "category", width: 12 },
    { header: "Mobile", key: "mobile", width: 16 },
    { header: "Email", key: "email", width: 28 },
    { header: "Submitted", key: "submitted", width: 12 },
  ];

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 24;

  // Add data rows
  students.forEach((student, index) => {
    worksheet.addRow({
      sno: index + 1,
      registrationNumber: student.registrationNumber,
      rollNumber: student.rollNumber || "-",
      name: student.name,
      fatherName: student.fatherName,
      year: student.yearSemester === "FIRST_YEAR" ? "First Year" : "Second Year",
      gender: student.gender || "-",
      category: student.category || "-",
      mobile: student.mobileNumber || "-",
      email: student.email || "-",
      submitted: student.isSubmitted ? "Yes" : "No",
    });
  });

  // Auto-filter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: students.length + 1, column: 11 },
  };

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  const yearLabel = year === "FIRST_YEAR" ? "first_year" : "second_year";
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="students_${yearLabel}.xlsx"`,
    },
  });
}

async function exportResultsData(year: string) {
  // Fetch students and subjects
  const [students, subjects] = await Promise.all([
    prisma.student.findMany({
      where: { yearSemester: year },
      orderBy: { registrationNumber: "asc" },
      include: {
        sessionalMarks: true,
        boardMarks: true,
        fixedMarks: true,
      },
    }),
    prisma.subject.findMany({
      where: { year },
      orderBy: { paperCode: "asc" },
    }),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Poly Student Data";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Results");

  // Build columns: S.No, Reg No, Roll No, Name, then per-subject columns, then summary
  const columns: Partial<ExcelJS.Column>[] = [
    { header: "S.No.", key: "sno", width: 8 },
    { header: "Reg. Number", key: "registrationNumber", width: 20 },
    { header: "Roll Number", key: "rollNumber", width: 14 },
    { header: "Name", key: "name", width: 24 },
  ];

  // Add subject columns
  for (const subject of subjects) {
    if (subject.isFixedMarks) {
      columns.push({
        header: `${subject.name} (Marks)`,
        key: `sub_${subject.id}_fixed`,
        width: 16,
      });
    } else {
      if (subject.hasTheory) {
        columns.push({
          header: `${subject.shortName || subject.name} (Theory)`,
          key: `sub_${subject.id}_theory`,
          width: 18,
        });
      }
      if (subject.hasPractical) {
        columns.push({
          header: `${subject.shortName || subject.name} (Practical)`,
          key: `sub_${subject.id}_practical`,
          width: 18,
        });
      }
    }
  }

  // Summary columns
  columns.push(
    { header: "Grand Total", key: "grandTotal", width: 14 },
    { header: "Percentage", key: "percentage", width: 12 },
    { header: "Result", key: "result", width: 10 }
  );

  worksheet.columns = columns;

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 10 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD9E1F2" },
  };
  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  headerRow.height = 30;

  // Process each student
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowData: Record<string, any> = {
      sno: i + 1,
      registrationNumber: student.registrationNumber,
      rollNumber: student.rollNumber || "-",
      name: student.name,
    };

    // Calculate results per subject
    const subjectResults: SubjectResult[] = subjects.map((subject) => {
      if (subject.isFixedMarks) {
        const fixed = student.fixedMarks.find(
          (f) => f.subjectId === subject.id
        );
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

      const theorySessional = student.sessionalMarks.find(
        (m) => m.subjectId === subject.id && m.type === "THEORY"
      );
      const practicalSessional = student.sessionalMarks.find(
        (m) => m.subjectId === subject.id && m.type === "PRACTICAL"
      );
      const board = student.boardMarks.find(
        (m) => m.subjectId === subject.id
      );

      const theorySessionalScore = theorySessional
        ? calculateTheorySessional(theorySessional)
        : null;
      const practicalSessionalScore = practicalSessional
        ? calculatePracticalSessional(practicalSessional)
        : null;

      const { theoryTotal, practicalTotal, grandTotal, status } =
        calculateSubjectResult(
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

    // Fill subject data into row
    for (const sr of subjectResults) {
      const subject = subjects.find((s) => s.id === sr.subjectId)!;
      if (sr.isFixedMarks) {
        rowData[`sub_${sr.subjectId}_fixed`] =
          sr.fixedMarks !== null ? sr.fixedMarks.toFixed(2) : "-";
      } else {
        if (subject.hasTheory) {
          rowData[`sub_${sr.subjectId}_theory`] =
            sr.theoryTotal !== null ? sr.theoryTotal.toFixed(2) : "-";
        }
        if (subject.hasPractical) {
          rowData[`sub_${sr.subjectId}_practical`] =
            sr.practicalTotal !== null ? sr.practicalTotal.toFixed(2) : "-";
        }
      }
    }

    // Calculate overall result
    const { overallResult } = calculateOverallResult(subjectResults);
    const gradedSubjects = subjectResults.filter((s) => !s.isFixedMarks);
    const totalMarksObtained = gradedSubjects.reduce(
      (sum, s) => sum + (s.grandTotal ?? 0),
      0
    );
    const totalMaxMarks = gradedSubjects.length * 200;
    const percentage =
      totalMaxMarks > 0 ? (totalMarksObtained / totalMaxMarks) * 100 : 0;

    rowData.grandTotal = totalMarksObtained.toFixed(2);
    rowData.percentage = (Math.round(percentage * 100) / 100).toFixed(2) + "%";
    rowData.result = overallResult;

    worksheet.addRow(rowData);
  }

  // Style result column with color
  const resultColIndex = columns.length;
  for (let rowIdx = 2; rowIdx <= students.length + 1; rowIdx++) {
    const cell = worksheet.getRow(rowIdx).getCell(resultColIndex);
    const value = cell.value as string;
    if (value === "PASS") {
      cell.font = { bold: true, color: { argb: "FF16A34A" } };
    } else if (value === "PBP") {
      cell.font = { bold: true, color: { argb: "FFEA580C" } };
    } else if (value === "FAIL") {
      cell.font = { bold: true, color: { argb: "FFDC2626" } };
    } else {
      cell.font = { bold: true, color: { argb: "FF6B7280" } };
    }
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  const yearLabel = year === "FIRST_YEAR" ? "first_year" : "second_year";
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="results_${yearLabel}.xlsx"`,
    },
  });
}
