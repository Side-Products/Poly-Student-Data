"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStudent } from "@/actions/student.actions";
import {
  getStudentMarks,
  getSubjectsForYear,
  upsertSessionalMarks,
  upsertBoardMarks,
  upsertFixedMarks,
} from "@/actions/marks.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type Subject = {
  id: string;
  paperCode: string;
  name: string;
  year: string;
  hasTheory: boolean;
  hasPractical: boolean;
  isFixedMarks: boolean;
};

type MarksState = Record<
  string,
  {
    theory?: { s1: string; s2: string; s3: string; board: string };
    practical?: {
      s1: string;
      s2: string;
      s3: string;
      assignment: string;
      fieldVisit: string;
      board: string;
    };
    fixed?: string;
  }
>;

export default function StudentMarksPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [student, setStudent] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [marks, setMarks] = useState<MarksState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const studentData = await getStudent(studentId);
      if (!studentData) return;
      setStudent(studentData);

      const [yearSubjects, existingMarks] = await Promise.all([
        getSubjectsForYear(studentData.yearSemester),
        getStudentMarks(studentId),
      ]);

      setSubjects(yearSubjects);

      // Build marks state from existing data
      const marksState: MarksState = {};
      for (const subj of yearSubjects) {
        marksState[subj.id] = {};

        if (subj.isFixedMarks) {
          const fixed = existingMarks.fixedMarks.find(
            (f) => f.subjectId === subj.id
          );
          marksState[subj.id].fixed = fixed?.marks?.toString() ?? "";
        } else {
          if (subj.hasTheory) {
            const ts = existingMarks.sessionalMarks.find(
              (m) => m.subjectId === subj.id && m.type === "THEORY"
            );
            marksState[subj.id].theory = {
              s1: ts?.sessional1?.toString() ?? "",
              s2: ts?.sessional2?.toString() ?? "",
              s3: ts?.sessional3?.toString() ?? "",
              board:
                existingMarks.boardMarks
                  .find((b) => b.subjectId === subj.id)
                  ?.theoryMarks?.toString() ?? "",
            };
          }
          if (subj.hasPractical) {
            const ps = existingMarks.sessionalMarks.find(
              (m) => m.subjectId === subj.id && m.type === "PRACTICAL"
            );
            marksState[subj.id].practical = {
              s1: ps?.sessional1?.toString() ?? "",
              s2: ps?.sessional2?.toString() ?? "",
              s3: ps?.sessional3?.toString() ?? "",
              assignment: ps?.assignmentMarks?.toString() ?? "",
              fieldVisit: ps?.fieldVisitMarks?.toString() ?? "",
              board:
                existingMarks.boardMarks
                  .find((b) => b.subjectId === subj.id)
                  ?.practicalMarks?.toString() ?? "",
            };
          }
        }
      }
      setMarks(marksState);
    } catch (error) {
      console.error("Failed to load student:", error);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateMark = (
    subjectId: string,
    section: "theory" | "practical" | "fixed",
    field: string,
    value: string
  ) => {
    setMarks((prev) => {
      const updated = { ...prev };
      if (section === "fixed") {
        updated[subjectId] = { ...updated[subjectId], fixed: value };
      } else {
        const sectionData =
          updated[subjectId]?.[section] ??
          (section === "theory"
            ? { s1: "", s2: "", s3: "", board: "" }
            : {
                s1: "",
                s2: "",
                s3: "",
                assignment: "",
                fieldVisit: "",
                board: "",
              });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sectionData as any)[field] = value;
        updated[subjectId] = { ...updated[subjectId], [section]: sectionData };
      }
      return updated;
    });
  };

  const calculateBestTwoAvg = (s1: string, s2: string, s3: string) => {
    const vals = [s1, s2, s3]
      .map(parseFloat)
      .filter((n) => !isNaN(n) && n > 0);
    if (vals.length < 2) return 0;
    vals.sort((a, b) => b - a);
    return (vals[0] + vals[1]) / 2;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const promises: Promise<unknown>[] = [];

      for (const subj of subjects) {
        const m = marks[subj.id];
        if (!m) continue;

        if (subj.isFixedMarks) {
          promises.push(
            upsertFixedMarks({
              studentId,
              subjectId: subj.id,
              marks: m.fixed ? parseFloat(m.fixed) : null,
            })
          );
        } else {
          if (subj.hasTheory && m.theory) {
            promises.push(
              upsertSessionalMarks({
                studentId,
                subjectId: subj.id,
                type: "THEORY",
                sessional1: m.theory.s1 ? parseFloat(m.theory.s1) : null,
                sessional2: m.theory.s2 ? parseFloat(m.theory.s2) : null,
                sessional3: m.theory.s3 ? parseFloat(m.theory.s3) : null,
              })
            );
          }

          if (subj.hasPractical && m.practical) {
            promises.push(
              upsertSessionalMarks({
                studentId,
                subjectId: subj.id,
                type: "PRACTICAL",
                sessional1: m.practical.s1
                  ? parseFloat(m.practical.s1)
                  : null,
                sessional2: m.practical.s2
                  ? parseFloat(m.practical.s2)
                  : null,
                sessional3: m.practical.s3
                  ? parseFloat(m.practical.s3)
                  : null,
                assignmentMarks: m.practical.assignment
                  ? parseFloat(m.practical.assignment)
                  : null,
                fieldVisitMarks: m.practical.fieldVisit
                  ? parseFloat(m.practical.fieldVisit)
                  : null,
              })
            );
          }

          // Board marks
          const board = marks[subj.id];
          if (board) {
            promises.push(
              upsertBoardMarks({
                studentId,
                subjectId: subj.id,
                theoryMarks: board.theory?.board
                  ? parseFloat(board.theory.board)
                  : null,
                practicalMarks: board.practical?.board
                  ? parseFloat(board.practical.board)
                  : null,
              })
            );
          }
        }
      }

      await Promise.all(promises);
      setSaveMessage("Marks saved successfully!");
    } catch (error) {
      console.error("Failed to save marks:", error);
      setSaveMessage("Failed to save marks. Please try again.");
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

  const regularSubjects = subjects.filter((s) => !s.isFixedMarks);
  const fixedSubjects = subjects.filter((s) => s.isFixedMarks);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marks Entry</h1>
          <p className="text-gray-600 mt-1">
            {student.name} ({student.registrationNumber})
          </p>
          <Badge variant="outline" className="mt-2">
            {student.yearSemester?.replace(/_/g, " ") || "Not assigned"}
          </Badge>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/students/${studentId}`)}
        >
          Back to Student
        </Button>
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

      <div className="space-y-6">
        {regularSubjects.map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <CardTitle>
                {subject.name} ({subject.paperCode})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {subject.hasTheory && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">
                    Theory Sessionals (Out of 40 each)
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {(["s1", "s2", "s3"] as const).map((field, idx) => (
                      <div key={field} className="space-y-2">
                        <Label>Sessional {idx + 1}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="40"
                          value={marks[subject.id]?.theory?.[field] ?? ""}
                          onChange={(e) =>
                            updateMark(
                              subject.id,
                              "theory",
                              field,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Label>Reduced to 20</Label>
                      <Input
                        type="text"
                        disabled
                        value={(
                          calculateBestTwoAvg(
                            marks[subject.id]?.theory?.s1 ?? "",
                            marks[subject.id]?.theory?.s2 ?? "",
                            marks[subject.id]?.theory?.s3 ?? ""
                          ) / 2
                        ).toFixed(2)}
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Board Marks (Out of 80)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="80"
                        value={marks[subject.id]?.theory?.board ?? ""}
                        onChange={(e) =>
                          updateMark(
                            subject.id,
                            "theory",
                            "board",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <Separator />
                </div>
              )}

              {subject.hasPractical && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">
                    Practical Sessionals (Out of 80 each)
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {(["s1", "s2", "s3"] as const).map((field, idx) => (
                      <div key={field} className="space-y-2">
                        <Label>Sessional {idx + 1}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="80"
                          value={marks[subject.id]?.practical?.[field] ?? ""}
                          onChange={(e) =>
                            updateMark(
                              subject.id,
                              "practical",
                              field,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Label>Reduced to 10</Label>
                      <Input
                        type="text"
                        disabled
                        value={(
                          calculateBestTwoAvg(
                            marks[subject.id]?.practical?.s1 ?? "",
                            marks[subject.id]?.practical?.s2 ?? "",
                            marks[subject.id]?.practical?.s3 ?? ""
                          ) / 8
                        ).toFixed(2)}
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Assignment (Out of 5)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={marks[subject.id]?.practical?.assignment ?? ""}
                        onChange={(e) =>
                          updateMark(
                            subject.id,
                            "practical",
                            "assignment",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field Visit (Out of 5)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="5"
                        value={marks[subject.id]?.practical?.fieldVisit ?? ""}
                        onChange={(e) =>
                          updateMark(
                            subject.id,
                            "practical",
                            "fieldVisit",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Board Marks (Out of 80)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="80"
                        value={marks[subject.id]?.practical?.board ?? ""}
                        onChange={(e) =>
                          updateMark(
                            subject.id,
                            "practical",
                            "board",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {fixedSubjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fixed Marks Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {fixedSubjects.map((subject) => (
                  <div key={subject.id} className="space-y-2">
                    <Label>
                      {subject.name} ({subject.paperCode})
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="50"
                      value={marks[subject.id]?.fixed ?? ""}
                      onChange={(e) =>
                        updateMark(
                          subject.id,
                          "fixed",
                          "marks",
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/students/${studentId}`)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Marks"}
          </Button>
        </div>
      </div>
    </div>
  );
}
