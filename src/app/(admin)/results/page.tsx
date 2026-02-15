"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStudents } from "@/actions/student.actions";
import { calculateStudentResult } from "@/actions/result.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ResultSummary } from "@/lib/result-calculator";

type Student = {
  id: string;
  registrationNumber: string;
  rollNumber: string | null;
  name: string;
};

type StudentResult = {
  student: Student;
  result: ResultSummary;
};

export default function BatchResultsPage() {
  const [year, setYear] = useState<string>("");
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!year) return;
    loadResults();
  }, [year]);

  const loadResults = async () => {
    setIsLoading(true);
    setStudentResults([]);
    try {
      const { students } = await getStudents({
        year,
        limit: 500,
      });

      const submittedStudents = (students as Student[]).filter(
        (s: Student & { isSubmitted?: boolean }) => s.isSubmitted
      );

      const results = await Promise.all(
        submittedStudents.map(async (student) => {
          try {
            const result = await calculateStudentResult(student.id);
            return { student, result };
          } catch {
            return null;
          }
        })
      );

      setStudentResults(
        results.filter((r): r is StudentResult => r !== null)
      );
    } catch (error) {
      console.error("Failed to load results:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = {
    total: studentResults.length,
    passed: studentResults.filter((r) => r.result.overallResult === "PASS")
      .length,
    pbp: studentResults.filter((r) => r.result.overallResult === "PBP").length,
    failed: studentResults.filter((r) => r.result.overallResult === "FAIL")
      .length,
    pending: studentResults.filter((r) => r.result.overallResult === "PENDING")
      .length,
  };

  const getResultBadgeColor = (result: string) => {
    switch (result) {
      case "PASS":
        return "bg-green-600";
      case "PBP":
        return "bg-orange-600";
      case "FAIL":
        return "bg-red-600";
      case "PENDING":
        return "bg-gray-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Batch Results</h1>
        <p className="text-gray-600 mt-2">
          View results for all students by year
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-64">
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIRST_YEAR">First Year</SelectItem>
                <SelectItem value="SECOND_YEAR">Second Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Computing results for all students... This may take a moment.
          </p>
        </div>
      )}

      {!isLoading && year && studentResults.length > 0 && (
        <>
          <div className="grid grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.total}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Passed</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.passed}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">PBP</p>
                <p className="text-2xl font-bold text-orange-600">
                  {summary.pbp}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {summary.failed}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-600">
                  {summary.pending}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Results{" "}
                <span className="text-gray-500 font-normal">
                  ({studentResults.length} students)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reg Number</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Total Marks</TableHead>
                    <TableHead className="text-right">Max Marks</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead className="text-center">Result</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentResults.map(({ student, result }) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.registrationNumber}
                      </TableCell>
                      <TableCell>{student.rollNumber || "-"}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell className="text-right">
                        {result.totalMarksObtained.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.totalMaxMarks}
                      </TableCell>
                      <TableCell className="text-right">
                        {result.percentage.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={getResultBadgeColor(result.overallResult)}
                        >
                          {result.overallResult}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/students/${student.id}/result`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!isLoading && year && studentResults.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              No submitted students found for this year.
            </p>
          </CardContent>
        </Card>
      )}

      {!year && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              Please select a year to view batch results.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
