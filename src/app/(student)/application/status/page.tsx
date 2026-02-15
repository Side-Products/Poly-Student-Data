"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ApplicationStatusPage() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/student/current");
      const data = await response.json();

      if (data.student) {
        if (!data.student.isSubmitted) {
          router.push("/application");
          return;
        }
        setStudent(data.student);
      }
    } catch (error) {
      console.error("Failed to load student data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading application...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Application not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Application Status
          </h1>
          <p className="text-gray-600 mt-2">View your submitted application</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint}>Print Application</Button>
          <Button variant="outline" onClick={() => router.push("/my-results")}>
            View Results
          </Button>
        </div>
      </div>

      <Card className="border-green-600 border-2">
        <CardHeader className="bg-green-50">
          <div className="flex items-center justify-between">
            <CardTitle>Application Submitted Successfully</CardTitle>
            <Badge className="bg-green-600 text-lg px-4 py-2">SUBMITTED</Badge>
          </div>
          {student.submittedAt && (
            <p className="text-sm text-gray-600">
              Submitted on:{" "}
              {new Date(student.submittedAt).toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}
            </p>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Registration Number
              </p>
              <p className="text-base font-semibold">
                {student.registrationNumber}
              </p>
            </div>
            {student.rollNumber && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Roll Number
                </p>
                <p className="text-base font-semibold">{student.rollNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-base font-semibold">{student.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Father's Name
              </p>
              <p className="text-base font-semibold">{student.fatherName}</p>
            </div>
            {student.motherName && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Mother's Name
                </p>
                <p className="text-base font-semibold">{student.motherName}</p>
              </div>
            )}
            {student.dateOfBirth && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Date of Birth
                </p>
                <p className="text-base font-semibold">
                  {new Date(student.dateOfBirth).toLocaleDateString("en-IN")}
                </p>
              </div>
            )}
            {student.gender && (
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-base font-semibold">
                  {student.gender.replace(/_/g, " ")}
                </p>
              </div>
            )}
            {student.category && (
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-base font-semibold">{student.category}</p>
              </div>
            )}
            {student.mobileNumber && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Mobile Number
                </p>
                <p className="text-base font-semibold">
                  {student.mobileNumber}
                </p>
              </div>
            )}
            {student.email && (
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-base font-semibold">{student.email}</p>
              </div>
            )}
            {student.aadhaarNumber && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Aadhaar Number
                </p>
                <p className="text-base font-semibold">
                  {student.aadhaarNumber}
                </p>
              </div>
            )}
            {student.religion && (
              <div>
                <p className="text-sm font-medium text-gray-500">Religion</p>
                <p className="text-base font-semibold">{student.religion}</p>
              </div>
            )}
            {student.nationality && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Nationality
                </p>
                <p className="text-base font-semibold">{student.nationality}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Education Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {student.yearSemester && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Year/Semester
                </p>
                <p className="text-base font-semibold">
                  {student.yearSemester.replace(/_/g, " ")}
                </p>
              </div>
            )}
            {student.branch && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Branch/Course
                </p>
                <p className="text-base font-semibold">{student.branch}</p>
              </div>
            )}
            {student.previousSchool && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Previous School/College
                </p>
                <p className="text-base font-semibold">
                  {student.previousSchool}
                </p>
              </div>
            )}
            {student.board && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Board/University
                </p>
                <p className="text-base font-semibold">{student.board}</p>
              </div>
            )}
            {student.passingYear && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Passing Year
                </p>
                <p className="text-base font-semibold">
                  {student.passingYear}
                </p>
              </div>
            )}
            {student.percentage && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Percentage/CGPA
                </p>
                <p className="text-base font-semibold">{student.percentage}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admission Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {student.admissionType && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Admission Type
                </p>
                <p className="text-base font-semibold">
                  {student.admissionType.replace(/_/g, " ")}
                </p>
              </div>
            )}
            {student.admissionDate && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Admission Date
                </p>
                <p className="text-base font-semibold">
                  {new Date(student.admissionDate).toLocaleDateString("en-IN")}
                </p>
              </div>
            )}
            {student.session && (
              <div>
                <p className="text-sm font-medium text-gray-500">Session</p>
                <p className="text-base font-semibold">{student.session}</p>
              </div>
            )}
            {student.hostelRequired && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Hostel Required
                </p>
                <p className="text-base font-semibold">
                  {student.hostelRequired}
                </p>
              </div>
            )}
            {student.transportRequired && (
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Transport Required
                </p>
                <p className="text-base font-semibold">
                  {student.transportRequired}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Permanent Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {student.permanentAddress && (
              <p className="text-base">{student.permanentAddress}</p>
            )}
            {student.permanentVillage && (
              <p className="text-sm text-gray-600">
                Village/City: {student.permanentVillage}
              </p>
            )}
            {student.permanentPostOffice && (
              <p className="text-sm text-gray-600">
                Post Office: {student.permanentPostOffice}
              </p>
            )}
            {student.permanentPoliceStation && (
              <p className="text-sm text-gray-600">
                Police Station: {student.permanentPoliceStation}
              </p>
            )}
            {student.permanentDistrict && (
              <p className="text-sm text-gray-600">
                District: {student.permanentDistrict}
              </p>
            )}
            {student.permanentState && (
              <p className="text-sm text-gray-600">
                State: {student.permanentState}
              </p>
            )}
            {student.permanentPinCode && (
              <p className="text-sm text-gray-600">
                PIN: {student.permanentPinCode}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Correspondence Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {student.correspondenceAddress && (
              <p className="text-base">{student.correspondenceAddress}</p>
            )}
            {student.correspondenceVillage && (
              <p className="text-sm text-gray-600">
                Village/City: {student.correspondenceVillage}
              </p>
            )}
            {student.correspondencePostOffice && (
              <p className="text-sm text-gray-600">
                Post Office: {student.correspondencePostOffice}
              </p>
            )}
            {student.correspondencePoliceStation && (
              <p className="text-sm text-gray-600">
                Police Station: {student.correspondencePoliceStation}
              </p>
            )}
            {student.correspondenceDistrict && (
              <p className="text-sm text-gray-600">
                District: {student.correspondenceDistrict}
              </p>
            )}
            {student.correspondenceState && (
              <p className="text-sm text-gray-600">
                State: {student.correspondenceState}
              </p>
            )}
            {student.correspondencePinCode && (
              <p className="text-sm text-gray-600">
                PIN: {student.correspondencePinCode}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parent Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Father's Details</h4>
              <Separator />
              {student.fatherQualification && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Qualification
                  </p>
                  <p className="text-base">
                    {student.fatherQualification.replace(/_/g, " ")}
                  </p>
                </div>
              )}
              {student.fatherOccupation && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Occupation
                  </p>
                  <p className="text-base">{student.fatherOccupation}</p>
                </div>
              )}
              {student.fatherIncome && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Annual Income
                  </p>
                  <p className="text-base">{student.fatherIncome}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Mother's Details</h4>
              <Separator />
              {student.motherQualification && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Qualification
                  </p>
                  <p className="text-base">
                    {student.motherQualification.replace(/_/g, " ")}
                  </p>
                </div>
              )}
              {student.motherOccupation && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Occupation
                  </p>
                  <p className="text-base">{student.motherOccupation}</p>
                </div>
              )}
              {student.motherIncome && (
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Annual Income
                  </p>
                  <p className="text-base">{student.motherIncome}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
