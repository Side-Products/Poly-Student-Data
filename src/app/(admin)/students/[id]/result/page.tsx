"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStudent } from "@/actions/student.actions";
import { calculateStudentResult } from "@/actions/result.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { ResultSummary, SubjectResult } from "@/lib/result-calculator";

export default function StudentResultPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [student, setStudent] = useState<any>(null);
  const [result, setResult] = useState<ResultSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStudentResult = useCallback(async () => {
    setIsLoading(true);
    try {
      const [studentData, resultData] = await Promise.all([
        getStudent(studentId),
        calculateStudentResult(studentId),
      ]);

      setStudent(studentData);
      setResult(resultData);
    } catch (error) {
      console.error("Failed to load result:", error);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadStudentResult();
  }, [loadStudentResult]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading result...</p>
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

  if (!result || result.subjects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Result</h1>
            <p className="text-gray-600 mt-1">
              {student.name} ({student.registrationNumber})
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/students/${studentId}`)}
          >
            Back to Student
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              No marks entered yet. Please enter marks first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return "bg-green-600";
      case "BK":
        return "bg-orange-600";
      case "FAIL":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return "bg-green-600 text-white";
      case "PBP":
        return "bg-orange-600 text-white";
      case "FAIL":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const backSubjects = result.subjects
    .filter((s: SubjectResult) => s.status === "BK")
    .map((s: SubjectResult) => s.subjectName);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Result</h1>
          <p className="text-gray-600 mt-1">
            {student.name} ({student.registrationNumber})
          </p>
          {student.rollNumber && (
            <p className="text-gray-600">Roll No: {student.rollNumber}</p>
          )}
          <Badge variant="outline" className="mt-2">
            {student.yearSemester?.replace(/_/g, " ") || "Not assigned"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Print Result
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/students/${studentId}`)}
          >
            Back to Student
          </Button>
        </div>
      </div>

      <Card
        className={`border-2 ${
          result.overallResult === "PASS"
            ? "border-green-600"
            : result.overallResult === "PBP"
            ? "border-orange-600"
            : "border-red-600"
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Overall Result</CardTitle>
            <Badge
              className={`${getOverallStatusColor(result.overallResult)} text-lg px-4 py-2`}
            >
              {result.overallResult}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Total Marks Obtained</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.totalMarksObtained.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Maximum Marks</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.totalMaxMarks}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Percentage</p>
              <p className="text-2xl font-bold text-gray-900">
                {result.percentage.toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Result</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Theory (S+B)</TableHead>
                <TableHead className="text-right">Practical (S+B)</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.subjects.map((subject: SubjectResult) => (
                <TableRow key={subject.subjectId}>
                  <TableCell className="font-medium">
                    {subject.subjectName}
                    <span className="text-gray-400 text-xs ml-2">
                      {subject.paperCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {subject.isFixedMarks
                      ? "-"
                      : subject.theoryTotal !== null
                      ? subject.theoryTotal.toFixed(2)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {subject.isFixedMarks
                      ? "-"
                      : subject.practicalTotal !== null
                      ? subject.practicalTotal.toFixed(2)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {subject.isFixedMarks
                      ? (subject.fixedMarks?.toFixed(2) ?? "-")
                      : subject.grandTotal !== null
                      ? subject.grandTotal.toFixed(2)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={getStatusColor(subject.status)}>
                      {subject.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {backSubjects.length > 0 && (
        <Card className="border-orange-600">
          <CardHeader>
            <CardTitle className="text-orange-600">Back Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {backSubjects.map((name: string, index: number) => (
                <li key={index} className="text-gray-700">
                  {name}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Result Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Badge className="bg-green-600">PASS</Badge>
              <span className="text-sm text-gray-700">
                Passed in all subjects
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-orange-600">PBP</Badge>
              <span className="text-sm text-gray-700">
                Passed with Back Paper (Failed in 1-2 subjects)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-orange-600">BK</Badge>
              <span className="text-sm text-gray-700">
                Back in this subject
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-red-600">FAIL</Badge>
              <span className="text-sm text-gray-700">
                Failed in 3 or more subjects
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
