"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  updateStudentApplication,
  submitApplication,
} from "@/actions/student.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  GENDERS,
  CATEGORIES,
  STUDENT_TYPES,
  ADMISSION_TYPES,
  AREA_TYPES,
  YEAR_SEMESTERS,
  QUALIFICATION_LEVELS,
  STATES,
  YES_NO_OPTIONS,
} from "@/lib/constants";

const TOTAL_STEPS = 6;

export default function ApplicationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [studentId, setStudentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [declaration, setDeclaration] = useState(false);

  const { register, handleSubmit, watch, setValue, getValues } = useForm();

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      // Get current user's student record
      const response = await fetch("/api/student/current");
      const data = await response.json();

      if (data.student) {
        if (data.student.isSubmitted) {
          router.push("/application/status");
          return;
        }
        setStudentId(data.student.id);
        // Pre-fill form with existing data
        Object.keys(data.student).forEach((key) => {
          setValue(key, data.student[key]);
        });
      }
    } catch (error) {
      console.error("Failed to load student data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async () => {
    const formData = getValues();
    try {
      await updateStudentApplication(studentId, formData);
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  const nextStep = async () => {
    await saveProgress();
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: any) => {
    if (currentStep < TOTAL_STEPS) {
      nextStep();
      return;
    }

    if (!declaration) {
      alert("Please accept the declaration to submit the application");
      return;
    }

    setIsSaving(true);
    try {
      await updateStudentApplication(studentId, data);
      await submitApplication(studentId);
      router.push("/application/status");
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred while submitting the application");
    } finally {
      setIsSaving(false);
    }
  };

  const stepTitles = [
    "Basic Information",
    "Education Details",
    "Admission Type",
    "Address Information",
    "Parent Qualifications",
    "Declaration",
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Student Application Form
        </h1>
        <p className="text-gray-600 mt-2">
          Complete all steps to submit your application
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Step {currentStep} of {TOTAL_STEPS}
              </span>
              <span>{Math.round((currentStep / TOTAL_STEPS) * 100)}%</span>
            </div>
            <Progress value={(currentStep / TOTAL_STEPS) * 100} />
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{stepTitles[currentStep - 1]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register("name")} required />
                </div>
                <div className="space-y-2">
                  <Label>Father's Name</Label>
                  <Input {...register("fatherName")} required />
                </div>
                <div className="space-y-2">
                  <Label>Mother's Name</Label>
                  <Input {...register("motherName")} required />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...register("dateOfBirth")} required />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={watch("gender") || ""}
                    onValueChange={(value) => setValue("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((gender) => (
                        <SelectItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={watch("category") || ""}
                    onValueChange={(value) => setValue("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input {...register("mobileNumber")} required />
                </div>
                <div className="space-y-2">
                  <Label>Email (Optional)</Label>
                  <Input type="email" {...register("email")} />
                </div>
                <div className="space-y-2">
                  <Label>Aadhaar Number</Label>
                  <Input {...register("aadhaarNumber")} required />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Input {...register("religion")} required />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input {...register("nationality")} defaultValue="Indian" required />
                </div>
                <div className="space-y-2">
                  <Label>Student Type</Label>
                  <Select
                    value={watch("studentType") || ""}
                    onValueChange={(value) => setValue("studentType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year/Semester</Label>
                  <Select
                    value={watch("yearSemester") || ""}
                    onValueChange={(value) => setValue("yearSemester", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year/semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_SEMESTERS.map((ys) => (
                        <SelectItem key={ys.value} value={ys.value}>
                          {ys.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Branch/Course</Label>
                  <Input {...register("branch")} required />
                </div>
                <div className="space-y-2">
                  <Label>Previous School/College</Label>
                  <Input {...register("previousSchool")} required />
                </div>
                <div className="space-y-2">
                  <Label>Board/University</Label>
                  <Input {...register("board")} required />
                </div>
                <div className="space-y-2">
                  <Label>Passing Year</Label>
                  <Input {...register("passingYear")} required />
                </div>
                <div className="space-y-2">
                  <Label>Percentage/CGPA</Label>
                  <Input {...register("percentage")} required />
                </div>
                <div className="space-y-2">
                  <Label>Roll Number (Optional)</Label>
                  <Input {...register("rollNumber")} />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Admission Type</Label>
                  <Select
                    value={watch("admissionType") || ""}
                    onValueChange={(value) => setValue("admissionType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select admission type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMISSION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admission Date</Label>
                  <Input type="date" {...register("admissionDate")} required />
                </div>
                <div className="space-y-2">
                  <Label>Session</Label>
                  <Input
                    {...register("session")}
                    placeholder="e.g., 2024-25"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hostel Required</Label>
                  <Select
                    value={watch("hostelRequired") || ""}
                    onValueChange={(value) => setValue("hostelRequired", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transport Required</Label>
                  <Select
                    value={watch("transportRequired") || ""}
                    onValueChange={(value) =>
                      setValue("transportRequired", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {YES_NO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Permanent Address
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Address</Label>
                      <Textarea {...register("permanentAddress")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Village/City</Label>
                      <Input {...register("permanentVillage")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Post Office</Label>
                      <Input {...register("permanentPostOffice")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Police Station</Label>
                      <Input {...register("permanentPoliceStation")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>District</Label>
                      <Input {...register("permanentDistrict")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={watch("permanentState") || ""}
                        onValueChange={(value) =>
                          setValue("permanentState", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>PIN Code</Label>
                      <Input {...register("permanentPinCode")} required />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Correspondence Address
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Address</Label>
                      <Textarea
                        {...register("correspondenceAddress")}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Village/City</Label>
                      <Input {...register("correspondenceVillage")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Post Office</Label>
                      <Input
                        {...register("correspondencePostOffice")}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Police Station</Label>
                      <Input
                        {...register("correspondencePoliceStation")}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>District</Label>
                      <Input {...register("correspondenceDistrict")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={watch("correspondenceState") || ""}
                        onValueChange={(value) =>
                          setValue("correspondenceState", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>PIN Code</Label>
                      <Input {...register("correspondencePinCode")} required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Father's Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Qualification</Label>
                      <Select
                        value={watch("fatherQualification") || ""}
                        onValueChange={(value) =>
                          setValue("fatherQualification", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          {QUALIFICATION_LEVELS.map((qual) => (
                            <SelectItem key={qual.value} value={qual.value}>
                              {qual.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input {...register("fatherOccupation")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Income</Label>
                      <Input {...register("fatherIncome")} required />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Mother's Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Qualification</Label>
                      <Select
                        value={watch("motherQualification") || ""}
                        onValueChange={(value) =>
                          setValue("motherQualification", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select qualification" />
                        </SelectTrigger>
                        <SelectContent>
                          {QUALIFICATION_LEVELS.map((qual) => (
                            <SelectItem key={qual.value} value={qual.value}>
                              {qual.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input {...register("motherOccupation")} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Income</Label>
                      <Input {...register("motherIncome")} required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Declaration</h3>
                  <p className="text-sm text-gray-700">
                    I hereby declare that all the information provided in this
                    application form is true and correct to the best of my
                    knowledge. I understand that any false information may lead
                    to cancellation of my admission.
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="declaration"
                    checked={declaration}
                    onCheckedChange={(checked) =>
                      setDeclaration(checked as boolean)
                    }
                  />
                  <label
                    htmlFor="declaration"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the declaration and confirm that all information
                    provided is accurate
                  </label>
                </div>

                {!declaration && (
                  <p className="text-sm text-red-600">
                    You must accept the declaration before submitting the
                    application
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={saveProgress}
              disabled={isSaving}
            >
              Save Progress
            </Button>
            <Button type="submit" disabled={isSaving}>
              {currentStep === TOTAL_STEPS
                ? isSaving
                  ? "Submitting..."
                  : "Submit Application"
                : "Next"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
