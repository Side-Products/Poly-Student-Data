"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getStudent(studentId: string) {
  return prisma.student.findUnique({
    where: { id: studentId },
    include: {
      addresses: true,
      qualifications: true,
    },
  });
}

export async function getStudentByUserId(userId: string) {
  return prisma.student.findUnique({
    where: { userId },
    include: {
      addresses: true,
      qualifications: true,
    },
  });
}

export async function updateStudentApplication(
  studentId: string,
  data: Record<string, unknown>,
  addresses?: { correspondence: Record<string, unknown>; permanent: Record<string, unknown> },
  qualifications?: Array<Record<string, unknown>>
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Student not found");

  // Students can't edit after submission
  if (student.isSubmitted && session.user.role !== "ADMIN") {
    throw new Error("Application already submitted. Contact admin for changes.");
  }

  // Students can only edit their own application
  if (session.user.role === "STUDENT" && student.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.$transaction(async (tx) => {
    // Only pick fields that exist in the Student model
    const allowedFields = [
      "registrationNumber", "rollNumber", "groupShift", "name", "fatherName",
      "yearSemester", "instituteName", "branchName", "email", "nationality",
      "dateOfBirth", "gender", "category", "subCategory", "mobileNumber",
      "landlineNumber", "feeSubmitted", "aadharNumber",
      "yearOfAdmissionFirstYear", "yearOfAdmissionSecondYear",
      "highSchoolPass", "intermediatePass", "highSchoolAreaType", "itiPass",
      "minority", "interQualifiedPCBPCM",
      "admissionType", "jeepRollNumber", "jeepRank", "twelfthBoard", "twelfthPercentage",
      "studentType", "transferFromCollege", "transferToCollege",
      "studyPermFromCollege", "studyPermToCollege",
      "motherName", "aadhaarNumber", "religion",
      "branch", "previousSchool", "board", "passingYear", "percentage",
      "admissionDate", "session", "hostelRequired", "transportRequired",
      "permanentAddress", "permanentVillage", "permanentBlock", "permanentTehsil", "permanentPostOffice",
      "permanentPoliceStation", "permanentDistrict", "permanentState", "permanentPinCode",
      "correspondenceAddress", "correspondenceVillage", "correspondenceBlock", "correspondenceTehsil", "correspondencePostOffice",
      "correspondencePoliceStation", "correspondenceDistrict", "correspondenceState", "correspondencePinCode",
      "fatherQualification", "fatherOccupation", "fatherIncome",
      "motherQualification", "motherOccupation", "motherIncome",
    ] as const;
    const studentData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in data) {
        studentData[field] = data[field];
      }
    }

    // Update student basic data
    await tx.student.update({
      where: { id: studentId },
      data: studentData as Parameters<typeof tx.student.update>[0]["data"],
    });

    // Update addresses
    if (addresses) {
      for (const type of ["CORRESPONDENCE", "PERMANENT"] as const) {
        const addr = type === "CORRESPONDENCE" ? addresses.correspondence : addresses.permanent;
        if (addr) {
          await tx.address.upsert({
            where: { studentId_type: { studentId, type } },
            update: addr as Parameters<typeof tx.address.update>[0]["data"],
            create: {
              studentId,
              type,
              ...addr,
            } as Parameters<typeof tx.address.create>[0]["data"],
          });
        }
      }
    }

    // Update qualifications
    if (qualifications) {
      for (const qual of qualifications) {
        const level = qual.level as string;
        await tx.qualification.upsert({
          where: { studentId_level: { studentId, level } },
          update: qual as Parameters<typeof tx.qualification.update>[0]["data"],
          create: {
            studentId,
            ...qual,
          } as Parameters<typeof tx.qualification.create>[0]["data"],
        });
      }
    }
  });

  revalidatePath("/application");
  revalidatePath(`/students/${studentId}`);
  return { success: true };
}

export async function submitApplication(studentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new Error("Student not found");

  if (student.isSubmitted) {
    throw new Error("Application already submitted");
  }

  if (session.user.role === "STUDENT" && student.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      isSubmitted: true,
      submittedAt: new Date(),
      declarationAccepted: true,
    },
  });

  revalidatePath("/application");
  return { success: true };
}

export async function getStudents(params?: {
  search?: string;
  year?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const { search, year, page = 1, limit = 20 } = params || {};
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { registrationNumber: { contains: search } },
      { rollNumber: { contains: search } },
    ];
  }
  if (year) {
    where.yearSemester = year;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where: where as any,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.student.count({ where: where as any }),
  ]);

  return { students, total, pages: Math.ceil(total / limit) };
}
