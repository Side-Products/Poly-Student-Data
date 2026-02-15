import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Registration Number is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  registrationNumber: z.string().min(1, "Registration Number is required"),
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().min(1, "Father's Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Confirm Password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
