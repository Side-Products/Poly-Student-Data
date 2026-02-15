"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getSubjectsForYear,
  getStudentMarks,
  upsertSessionalMarks,
  upsertBoardMarks,
  upsertFixedMarks,
} from "@/actions/marks.actions";
import { getStudents } from "@/actions/student.actions";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Subject = {
  id: string;
  paperCode: string;
  name: string;
  shortName: string | null;
  year: string;
  hasTheory: boolean;
  hasPractical: boolean;
  isFixedMarks: boolean;
};

type Student = {
  id: string;
  name: string;
  registrationNumber: string;
  rollNumber: string | null;
  yearSemester: string;
};

// Per-student marks for the selected subject
type StudentMarksRow = {
  studentId: string;
  // Theory sessionals
  theoryS1: string;
  theoryS2: string;
  theoryS3: string;
  theoryBoard: string;
  // Practical sessionals
  practicalS1: string;
  practicalS2: string;
  practicalS3: string;
  practicalAssignment: string;
  practicalFieldVisit: string;
  practicalBoard: string;
  // Fixed marks
  fixedMarks: string;
};

type MarksMap = Record<string, StudentMarksRow>;

export default function BulkMarksPage() {
  const [year, setYear] = useState<string>("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [marksMap, setMarksMap] = useState<MarksMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Load subjects when year changes
  useEffect(() => {
    if (!year) {
      setSubjects([]);
      setSelectedSubjectId("");
      return;
    }
    const loadSubjects = async () => {
      try {
        const data = await getSubjectsForYear(year);
        setSubjects(data as Subject[]);
        setSelectedSubjectId("");
      } catch (error) {
        console.error("Failed to load subjects:", error);
      }
    };
    loadSubjects();
  }, [year]);

  // Load students and their marks when subject changes
  const loadStudentsAndMarks = useCallback(async () => {
    if (!year || !selectedSubjectId) {
      setStudents([]);
      setMarksMap({});
      return;
    }

    setIsLoading(true);
    setSaveMessage(null);
    try {
      // Fetch all students for this year (large limit to get all)
      const result = await getStudents({ year, limit: 500 });
      const studentList = result.students as Student[];
      setStudents(studentList);

      // Fetch marks for each student
      const newMarksMap: MarksMap = {};
      await Promise.all(
        studentList.map(async (student) => {
          const existingMarks = await getStudentMarks(student.id);

          const row: StudentMarksRow = {
            studentId: student.id,
            theoryS1: "",
            theoryS2: "",
            theoryS3: "",
            theoryBoard: "",
            practicalS1: "",
            practicalS2: "",
            practicalS3: "",
            practicalAssignment: "",
            practicalFieldVisit: "",
            practicalBoard: "",
            fixedMarks: "",
          };

          // Find existing sessional marks for this subject
          const theorySessional = existingMarks.sessionalMarks.find(
            (m) => m.subjectId === selectedSubjectId && m.type === "THEORY"
          );
          if (theorySessional) {
            row.theoryS1 = theorySessional.sessional1?.toString() ?? "";
            row.theoryS2 = theorySessional.sessional2?.toString() ?? "";
            row.theoryS3 = theorySessional.sessional3?.toString() ?? "";
          }

          const practicalSessional = existingMarks.sessionalMarks.find(
            (m) => m.subjectId === selectedSubjectId && m.type === "PRACTICAL"
          );
          if (practicalSessional) {
            row.practicalS1 = practicalSessional.sessional1?.toString() ?? "";
            row.practicalS2 = practicalSessional.sessional2?.toString() ?? "";
            row.practicalS3 = practicalSessional.sessional3?.toString() ?? "";
            row.practicalAssignment =
              practicalSessional.assignmentMarks?.toString() ?? "";
            row.practicalFieldVisit =
              practicalSessional.fieldVisitMarks?.toString() ?? "";
          }

          // Find existing board marks
          const board = existingMarks.boardMarks.find(
            (b) => b.subjectId === selectedSubjectId
          );
          if (board) {
            row.theoryBoard = board.theoryMarks?.toString() ?? "";
            row.practicalBoard = board.practicalMarks?.toString() ?? "";
          }

          // Find existing fixed marks
          const fixed = existingMarks.fixedMarks.find(
            (f) => f.subjectId === selectedSubjectId
          );
          if (fixed) {
            row.fixedMarks = fixed.marks?.toString() ?? "";
          }

          newMarksMap[student.id] = row;
        })
      );

      setMarksMap(newMarksMap);
    } catch (error) {
      console.error("Failed to load students and marks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [year, selectedSubjectId]);

  useEffect(() => {
    loadStudentsAndMarks();
  }, [loadStudentsAndMarks]);

  const updateMark = (
    studentId: string,
    field: keyof StudentMarksRow,
    value: string
  ) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSaveAll = async () => {
    if (!selectedSubject) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const promises: Promise<unknown>[] = [];

      for (const student of students) {
        const row = marksMap[student.id];
        if (!row) continue;

        if (selectedSubject.isFixedMarks) {
          promises.push(
            upsertFixedMarks({
              studentId: student.id,
              subjectId: selectedSubject.id,
              marks: row.fixedMarks ? parseFloat(row.fixedMarks) : null,
            })
          );
        } else {
          if (selectedSubject.hasTheory) {
            promises.push(
              upsertSessionalMarks({
                studentId: student.id,
                subjectId: selectedSubject.id,
                type: "THEORY",
                sessional1: row.theoryS1 ? parseFloat(row.theoryS1) : null,
                sessional2: row.theoryS2 ? parseFloat(row.theoryS2) : null,
                sessional3: row.theoryS3 ? parseFloat(row.theoryS3) : null,
              })
            );
          }

          if (selectedSubject.hasPractical) {
            promises.push(
              upsertSessionalMarks({
                studentId: student.id,
                subjectId: selectedSubject.id,
                type: "PRACTICAL",
                sessional1: row.practicalS1
                  ? parseFloat(row.practicalS1)
                  : null,
                sessional2: row.practicalS2
                  ? parseFloat(row.practicalS2)
                  : null,
                sessional3: row.practicalS3
                  ? parseFloat(row.practicalS3)
                  : null,
                assignmentMarks: row.practicalAssignment
                  ? parseFloat(row.practicalAssignment)
                  : null,
                fieldVisitMarks: row.practicalFieldVisit
                  ? parseFloat(row.practicalFieldVisit)
                  : null,
              })
            );
          }

          // Board marks (only if subject has theory or practical)
          if (selectedSubject.hasTheory || selectedSubject.hasPractical) {
            promises.push(
              upsertBoardMarks({
                studentId: student.id,
                subjectId: selectedSubject.id,
                theoryMarks: row.theoryBoard
                  ? parseFloat(row.theoryBoard)
                  : null,
                practicalMarks: row.practicalBoard
                  ? parseFloat(row.practicalBoard)
                  : null,
              })
            );
          }
        }
      }

      await Promise.all(promises);
      setSaveMessage({
        type: "success",
        text: `Marks saved successfully for ${students.length} students!`,
      });
    } catch (error) {
      console.error("Failed to save marks:", error);
      setSaveMessage({
        type: "error",
        text: "Failed to save marks. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bulk Marks Entry</h1>
        <p className="text-gray-600 mt-1">
          Select a year and subject to enter marks for all students at once
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Select Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="w-64 space-y-2">
              <Label>Year</Label>
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
            <div className="flex-1 space-y-2">
              <Label>Subject</Label>
              <Select
                value={selectedSubjectId}
                onValueChange={setSelectedSubjectId}
                disabled={subjects.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      year
                        ? subjects.length === 0
                          ? "No subjects found"
                          : "Select subject"
                        : "Select year first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.paperCode} - {subject.name}
                      {subject.isFixedMarks
                        ? " (Fixed)"
                        : subject.hasTheory && subject.hasPractical
                          ? " (T+P)"
                          : subject.hasTheory
                            ? " (Theory)"
                            : " (Practical)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedSubject && (
            <div className="flex gap-2 mt-3">
              <Badge variant="outline">
                {selectedSubject.paperCode}
              </Badge>
              {selectedSubject.isFixedMarks ? (
                <Badge variant="secondary">Fixed Marks</Badge>
              ) : (
                <>
                  {selectedSubject.hasTheory && (
                    <Badge variant="secondary">Theory</Badge>
                  )}
                  {selectedSubject.hasPractical && (
                    <Badge variant="secondary">Practical</Badge>
                  )}
                </>
              )}
              <Badge variant="outline">
                {students.length} students
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save message */}
      {saveMessage && (
        <div
          className={`p-4 rounded-lg ${
            saveMessage.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading students and marks...</p>
        </div>
      )}

      {/* No selection state */}
      {!isLoading && (!year || !selectedSubjectId) && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              Select a year and subject above to start entering marks
            </p>
          </CardContent>
        </Card>
      )}

      {/* Marks table */}
      {!isLoading && selectedSubject && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedSubject.name}{" "}
              <span className="text-gray-500 font-normal">
                ({students.length} students)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white z-10 min-w-[50px]">
                      #
                    </TableHead>
                    <TableHead className="sticky left-[50px] bg-white z-10 min-w-[160px]">
                      Student Name
                    </TableHead>
                    <TableHead className="sticky left-[210px] bg-white z-10 min-w-[120px]">
                      Reg Number
                    </TableHead>
                    {selectedSubject.isFixedMarks ? (
                      <TableHead className="min-w-[100px] text-center">
                        Marks
                      </TableHead>
                    ) : (
                      <>
                        {selectedSubject.hasTheory && (
                          <>
                            <TableHead className="min-w-[80px] text-center">
                              Th. S1
                            </TableHead>
                            <TableHead className="min-w-[80px] text-center">
                              Th. S2
                            </TableHead>
                            <TableHead className="min-w-[80px] text-center">
                              Th. S3
                            </TableHead>
                            <TableHead className="min-w-[80px] text-center">
                              Th. Board
                            </TableHead>
                          </>
                        )}
                        {selectedSubject.hasPractical && (
                          <>
                            <TableHead className="min-w-[80px] text-center">
                              Pr. S1
                            </TableHead>
                            <TableHead className="min-w-[80px] text-center">
                              Pr. S2
                            </TableHead>
                            <TableHead className="min-w-[80px] text-center">
                              Pr. S3
                            </TableHead>
                            <TableHead className="min-w-[80px] text-center">
                              Pr. Assign
                            </TableHead>
                            <TableHead className="min-w-[80px] text-center">
                              Pr. FV
                            </TableHead>
                            <TableHead className="min-w-[80px] text-center">
                              Pr. Board
                            </TableHead>
                          </>
                        )}
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => {
                    const row = marksMap[student.id];
                    if (!row) return null;

                    return (
                      <TableRow key={student.id}>
                        <TableCell className="sticky left-0 bg-white z-10 text-gray-500 text-xs">
                          {index + 1}
                        </TableCell>
                        <TableCell className="sticky left-[50px] bg-white z-10 font-medium text-sm">
                          {student.name}
                        </TableCell>
                        <TableCell className="sticky left-[210px] bg-white z-10 text-sm text-gray-600">
                          {student.registrationNumber}
                        </TableCell>
                        {selectedSubject.isFixedMarks ? (
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="50"
                              className="h-8 w-20 text-center text-sm mx-auto"
                              value={row.fixedMarks}
                              onChange={(e) =>
                                updateMark(
                                  student.id,
                                  "fixedMarks",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                        ) : (
                          <>
                            {selectedSubject.hasTheory && (
                              <>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="40"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.theoryS1}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "theoryS1",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="40"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.theoryS2}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "theoryS2",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="40"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.theoryS3}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "theoryS3",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="80"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.theoryBoard}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "theoryBoard",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                              </>
                            )}
                            {selectedSubject.hasPractical && (
                              <>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="80"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.practicalS1}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "practicalS1",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="80"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.practicalS2}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "practicalS2",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="80"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.practicalS3}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "practicalS3",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="5"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.practicalAssignment}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "practicalAssignment",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="5"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.practicalFieldVisit}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "practicalFieldVisit",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="80"
                                    className="h-8 w-20 text-center text-sm mx-auto"
                                    value={row.practicalBoard}
                                    onChange={(e) =>
                                      updateMark(
                                        student.id,
                                        "practicalBoard",
                                        e.target.value
                                      )
                                    }
                                  />
                                </TableCell>
                              </>
                            )}
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No students found */}
      {!isLoading && selectedSubject && students.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              No students found for {year?.replace(/_/g, " ")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      {!isLoading && selectedSubject && students.length > 0 && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={handleSaveAll}
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : `Save All (${students.length} students)`}
          </Button>
        </div>
      )}
    </div>
  );
}
