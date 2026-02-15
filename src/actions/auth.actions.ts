"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/schemas/auth.schema";
import { AuthError } from "next-auth";

export async function loginAction(identifier: string, password: string) {
  try {
    // Look up user first to get role for client-side redirect
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { regNumber: identifier }],
      },
      select: { role: true },
    });

    await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    return { success: true, role: user?.role ?? "STUDENT" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: "Invalid credentials" };
    }
    throw error;
  }
}

export async function registerAction(formData: {
  registrationNumber: string;
  name: string;
  fatherName: string;
  email?: string;
  password: string;
  confirmPassword: string;
}) {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { registrationNumber, name, fatherName, email, password } = parsed.data;

  // Check if registration number already exists
  const existingUser = await prisma.user.findFirst({
    where: { regNumber: registrationNumber },
  });
  if (existingUser) {
    return { success: false, error: "Registration number already registered" };
  }

  // Check email uniqueness if provided
  if (email) {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return { success: false, error: "Email already registered" };
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user and student in a transaction
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        regNumber: registrationNumber,
        email: email || null,
        password: hashedPassword,
        name,
        role: "STUDENT",
      },
    });

    await tx.student.create({
      data: {
        userId: user.id,
        registrationNumber,
        name,
        fatherName,
        email: email || null,
      },
    });
  });

  return { success: true };
}

export async function logoutAction() {
  await signOut({ redirect: false });
}
