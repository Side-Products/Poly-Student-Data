import { z } from "zod";

// Step 1: Basic Information
export const basicInfoSchema = z.object({
  registrationNumber: z.string().min(1, "Registration Number is required"),
  rollNumber: z.string().optional(),
  groupShift: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().min(1, "Father's Name is required"),
  yearSemester: z.enum(["FIRST_YEAR", "SECOND_YEAR"]),
  instituteName: z.string().optional(),
  branchName: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  category: z.enum(["GENERAL", "OBC", "SC", "ST", "EWS", "OTHER"]).optional(),
  subCategory: z.string().optional(),
  mobileNumber: z.string().regex(/^\d{10}$/, "Must be 10 digits").optional().or(z.literal("")),
  landlineNumber: z.string().optional(),
  feeSubmitted: z.string().optional(),
  aadharNumber: z.string().regex(/^\d{12}$/, "Must be 12 digits").optional().or(z.literal("")),
});

// Step 2: Education Background
export const educationSchema = z.object({
  highSchoolPass: z.boolean().optional(),
  intermediatePass: z.boolean().optional(),
  highSchoolAreaType: z.enum(["RURAL", "URBAN"]).optional(),
  itiPass: z.boolean().optional(),
  minority: z.boolean().optional(),
  interQualifiedPCBPCM: z.boolean().optional(),
});

// Step 3: Admission & Student Type
export const admissionSchema = z.object({
  admissionType: z.enum(["JEEP", "NON_JEEP"]).optional(),
  jeepRollNumber: z.string().optional(),
  jeepRank: z.string().optional(),
  studentType: z.enum(["REGULAR", "PRIVATE", "TRANSFERRED", "STUDY_PERMISSION"]).optional(),
  transferFromCollege: z.string().optional(),
  transferToCollege: z.string().optional(),
  studyPermFromCollege: z.string().optional(),
  studyPermToCollege: z.string().optional(),
}).refine(
  (data) => {
    if (data.admissionType === "JEEP") {
      return !!data.jeepRollNumber && !!data.jeepRank;
    }
    return true;
  },
  { message: "JEEP Roll Number and Rank are required for JEEP admission", path: ["jeepRollNumber"] }
);

// Step 4: Address
export const addressSchema = z.object({
  address: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  pinCode: z.string().regex(/^\d{6}$/, "Must be 6 digits").optional().or(z.literal("")),
  tehsil: z.string().optional(),
  block: z.string().optional(),
});

export const addressesSchema = z.object({
  correspondence: addressSchema,
  permanent: addressSchema,
  sameAsCorrespondence: z.boolean().optional(),
});

// Step 5: Qualification
export const qualificationRowSchema = z.object({
  level: z.string(),
  courseName: z.string().optional(),
  boardUniversity: z.string().optional(),
  passingYear: z.number().int().min(1900).max(2100).optional().nullable(),
  marksObtained: z.number().min(0).optional().nullable(),
  maxMarks: z.number().min(0).optional().nullable(),
  percentageGrade: z.string().optional(),
});

export const qualificationsSchema = z.object({
  qualifications: z.array(qualificationRowSchema),
});

// Step 6: Declaration
export const declarationSchema = z.object({
  declarationAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the declaration to submit",
  }),
});

// Combined schema for the full application
export const fullApplicationSchema = basicInfoSchema
  .merge(educationSchema)
  .merge(
    z.object({
      admissionType: z.enum(["JEEP", "NON_JEEP"]).optional(),
      jeepRollNumber: z.string().optional(),
      jeepRank: z.string().optional(),
      studentType: z.enum(["REGULAR", "PRIVATE", "TRANSFERRED", "STUDY_PERMISSION"]).optional(),
      transferFromCollege: z.string().optional(),
      transferToCollege: z.string().optional(),
      studyPermFromCollege: z.string().optional(),
      studyPermToCollege: z.string().optional(),
    })
  );

export type BasicInfoInput = z.infer<typeof basicInfoSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type AdmissionInput = z.infer<typeof admissionSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type AddressesInput = z.infer<typeof addressesSchema>;
export type QualificationRowInput = z.infer<typeof qualificationRowSchema>;
export type QualificationsInput = z.infer<typeof qualificationsSchema>;
export type DeclarationInput = z.infer<typeof declarationSchema>;
