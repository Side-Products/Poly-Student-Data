"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { getStudent, updateStudentApplication } from "@/actions/student.actions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GENDERS,
  CATEGORIES,
  STUDENT_TYPES,
  ADMISSION_TYPES,
  AREA_TYPES,
  YEAR_SEMESTERS,
  STATES,
  BRANCHES,
} from "@/lib/constants";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const loadStudent = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStudent(studentId);
      if (data) {
        setStudent(data);
        // Flatten addresses into form fields
        const formData: Record<string, unknown> = { ...data };
        if (data.addresses) {
          for (const addr of data.addresses) {
            const prefix =
              addr.type === "CORRESPONDENCE" ? "corr" : "perm";
            formData[`${prefix}Address`] = addr.address;
            formData[`${prefix}State`] = addr.state;
            formData[`${prefix}District`] = addr.district;
            formData[`${prefix}PinCode`] = addr.pinCode;
            formData[`${prefix}Tehsil`] = addr.tehsil;
            formData[`${prefix}Block`] = addr.block;
          }
        }
        reset(formData);
      }
    } catch (error) {
      console.error("Failed to load student:", error);
    } finally {
      setIsLoading(false);
    }
  }, [studentId, reset]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Separate address fields from student fields
      const {
        corrAddress, corrState, corrDistrict, corrPinCode, corrTehsil, corrBlock,
        permAddress, permState, permDistrict, permPinCode, permTehsil, permBlock,
        addresses: _a, qualifications: _q, user: _u,
        sessionalMarks: _sm, boardMarks: _bm, fixedMarks: _fm,
        id: _id, userId: _uid, createdAt: _ca, updatedAt: _ua,
        ...studentData
      } = data;

      const addressData = {
        correspondence: {
          address: corrAddress,
          state: corrState,
          district: corrDistrict,
          pinCode: corrPinCode,
          tehsil: corrTehsil,
          block: corrBlock,
        },
        permanent: {
          address: permAddress,
          state: permState,
          district: permDistrict,
          pinCode: permPinCode,
          tehsil: permTehsil,
          block: permBlock,
        },
      };

      await updateStudentApplication(studentId, studentData, addressData);
      setSaveMessage("Student data updated successfully!");
      loadStudent();
    } catch (error) {
      setSaveMessage("An error occurred while updating student data");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading student data...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-600">Student not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-gray-600 mt-1">
            {student.registrationNumber}
            {student.rollNumber && ` | Roll No: ${student.rollNumber}`}
          </p>
        </div>
        <div className="flex gap-2">
          {student.isSubmitted && (
            <Badge className="bg-green-600">Application Submitted</Badge>
          )}
          <Button variant="outline" onClick={() => router.push("/students")}>
            Back to List
          </Button>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`p-4 rounded-lg ${
            saveMessage.includes("success")
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="admission">Admission</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Registration Number</Label>
                    <Input {...register("registrationNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Roll Number</Label>
                    <Input {...register("rollNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input {...register("name")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Father&apos;s Name</Label>
                    <Input {...register("fatherName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" {...register("dateOfBirth")} />
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
                    <Label>Sub Category</Label>
                    <Input {...register("subCategory")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number</Label>
                    <Input {...register("mobileNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Landline Number</Label>
                    <Input {...register("landlineNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" {...register("email")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhar Number</Label>
                    <Input {...register("aadharNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input {...register("nationality")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Group/Shift</Label>
                    <Input {...register("groupShift")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Education & Year Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    <Label>Institute Name</Label>
                    <Input {...register("instituteName")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch Name</Label>
                    <Select
                      value={watch("branchName") || ""}
                      onValueChange={(value) => setValue("branchName", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch/course" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCHES.map((branch) => (
                          <SelectItem key={branch.value} value={branch.value}>
                            {branch.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>High School Area Type</Label>
                    <Select
                      value={watch("highSchoolAreaType") || ""}
                      onValueChange={(value) =>
                        setValue("highSchoolAreaType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select area type" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREA_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fee Submitted</Label>
                    <Input {...register("feeSubmitted")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admission">
            <Card>
              <CardHeader>
                <CardTitle>Admission & Student Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Admission Type</Label>
                    <Select
                      value={watch("admissionType") || ""}
                      onValueChange={(value) =>
                        setValue("admissionType", value)
                      }
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
                    <Label>JEEP Roll Number</Label>
                    <Input {...register("jeepRollNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label>JEEP Rank</Label>
                    <Input {...register("jeepRank")} />
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
                  <div className="space-y-2">
                    <Label>Transfer From College</Label>
                    <Input {...register("transferFromCollege")} />
                  </div>
                  <div className="space-y-2">
                    <Label>Transfer To College</Label>
                    <Input {...register("transferToCollege")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Correspondence Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Address</Label>
                      <Input {...register("corrAddress")} />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={watch("corrState") || ""}
                        onValueChange={(value) =>
                          setValue("corrState", value)
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
                      <Label>District</Label>
                      <Input {...register("corrDistrict")} />
                    </div>
                    <div className="space-y-2">
                      <Label>PIN Code</Label>
                      <Input {...register("corrPinCode")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tehsil</Label>
                      <Input {...register("corrTehsil")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Block</Label>
                      <Input {...register("corrBlock")} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Permanent Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Address</Label>
                      <Input {...register("permAddress")} />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select
                        value={watch("permState") || ""}
                        onValueChange={(value) =>
                          setValue("permState", value)
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
                      <Label>District</Label>
                      <Input {...register("permDistrict")} />
                    </div>
                    <div className="space-y-2">
                      <Label>PIN Code</Label>
                      <Input {...register("permPinCode")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tehsil</Label>
                      <Input {...register("permTehsil")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Block</Label>
                      <Input {...register("permBlock")} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/students")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
