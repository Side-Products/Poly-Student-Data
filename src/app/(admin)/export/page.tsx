"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type StudentOption = {
  id: string;
  name: string;
  registrationNumber: string;
};

export default function ExportPage() {
  const [year, setYear] = useState<string>("FIRST_YEAR");
  const [exportType, setExportType] = useState<string>("students-excel");
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchStudents = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setStudents([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/export/pdf?search=${encodeURIComponent(query)}&year=${year}`
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch {
      console.error("Failed to search students");
    } finally {
      setIsSearching(false);
    }
  }, [year]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (exportType === "student-pdf") {
        searchStudents(studentSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [studentSearch, exportType, searchStudents]);

  // Reset student selection when export type or year changes
  useEffect(() => {
    setSelectedStudentId("");
    setStudentSearch("");
    setStudents([]);
  }, [exportType, year]);

  const handleDownload = async () => {
    setError(null);
    setIsDownloading(true);

    try {
      if (exportType === "students-excel" || exportType === "results-excel") {
        const type = exportType === "students-excel" ? "students" : "results";
        const res = await fetch(
          `/api/export/excel?type=${type}&year=${year}`
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Export failed");
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const filename =
          type === "students"
            ? `students_${year.toLowerCase()}.xlsx`
            : `results_${year.toLowerCase()}.xlsx`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else if (exportType === "student-pdf") {
        if (!selectedStudentId) {
          setError("Please select a student first");
          setIsDownloading(false);
          return;
        }

        // Open the PDF route in a new tab for printing
        window.open(
          `/api/export/pdf?studentId=${selectedStudentId}`,
          "_blank"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsDownloading(false);
    }
  };

  const isPdfType = exportType === "student-pdf";
  const canDownload =
    !isDownloading &&
    year &&
    exportType &&
    (!isPdfType || selectedStudentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
        <p className="text-gray-600 mt-2">
          Export student data, results, or application forms
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Year Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIRST_YEAR">First Year</SelectItem>
                <SelectItem value="SECOND_YEAR">Second Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Export Type
            </label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select export type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="students-excel">
                  Student Data (Excel)
                </SelectItem>
                <SelectItem value="results-excel">Results (Excel)</SelectItem>
                <SelectItem value="student-pdf">
                  Student Application (PDF)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Student Search (only for PDF export) */}
          {isPdfType && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Student
              </label>
              <Input
                placeholder="Search by name or registration number..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="max-w-sm"
              />

              {isSearching && (
                <p className="text-sm text-gray-500">Searching...</p>
              )}

              {students.length > 0 && (
                <div className="border rounded-md max-w-sm max-h-48 overflow-y-auto">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setStudentSearch(
                          `${student.name} (${student.registrationNumber})`
                        );
                        setStudents([]);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 border-b last:border-b-0 ${
                        selectedStudentId === student.id
                          ? "bg-blue-50 text-blue-700"
                          : ""
                      }`}
                    >
                      <span className="font-medium">{student.name}</span>
                      <span className="text-gray-500 ml-2">
                        ({student.registrationNumber})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {studentSearch.length >= 2 &&
                !isSearching &&
                students.length === 0 &&
                !selectedStudentId && (
                  <p className="text-sm text-gray-500">No students found</p>
                )}

              {selectedStudentId && (
                <p className="text-sm text-green-600">Student selected</p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Download Button */}
          <Button
            onClick={handleDownload}
            disabled={!canDownload}
            className="w-full max-w-sm"
          >
            {isDownloading ? "Downloading..." : "Download"}
          </Button>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle>Export Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-900">
                Student Data (Excel):
              </span>{" "}
              Exports a list of all students for the selected year with their
              basic details including registration number, name, contact info,
              and submission status.
            </div>
            <div>
              <span className="font-medium text-gray-900">
                Results (Excel):
              </span>{" "}
              Exports calculated results for all students in the selected year,
              including subject-wise marks, totals, percentage, and pass/fail
              status.
            </div>
            <div>
              <span className="font-medium text-gray-900">
                Student Application (PDF):
              </span>{" "}
              Generates a printable application form for a specific student with
              all their submitted data. Opens in a new tab for printing.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
