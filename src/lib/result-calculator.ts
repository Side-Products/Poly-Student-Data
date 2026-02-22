export interface SessionalInput {
  sessional1: string | null;
  sessional2: string | null;
  sessional3: string | null;
}

export interface PracticalSessionalInput extends SessionalInput {
  assignmentMarks: string | null;
  fieldVisitMarks: string | null;
}

export interface SubjectResult {
  subjectId: string;
  subjectName: string;
  paperCode: string;
  theorySessional: number | null;
  theoryBoard: number | null;
  theoryTotal: number | null;
  practicalSessional: number | null;
  practicalBoard: number | null;
  practicalTotal: number | null;
  grandTotal: number | null;
  status: "PASS" | "BK";
  isFixedMarks: boolean;
  fixedMarks: number | null;
}

export interface ResultSummary {
  subjects: SubjectResult[];
  overallResult: "PASS" | "PBP" | "FAIL" | "PENDING";
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  backPaperCount: number;
}

// Parse a mark string: "AB" → 0, empty/null → null, otherwise parseFloat
export function parseMarkValue(val: string | null | undefined): number | null {
  if (val === null || val === undefined || val.trim() === "") return null;
  if (val.trim().toUpperCase() === "AB") return 0;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

// Best 2 of 3 sessionals, averaged
function bestTwoAverage(marks: (number | null)[]): number | null {
  const valid = marks.filter((m): m is number => m !== null);
  if (valid.length < 2) return null;
  valid.sort((a, b) => b - a);
  return (valid[0] + valid[1]) / 2;
}

// Theory: 3 sessionals out of 40 each. Best 2 averaged.
export function calculateTheorySessional(input: SessionalInput): number | null {
  return bestTwoAverage([
    parseMarkValue(input.sessional1),
    parseMarkValue(input.sessional2),
    parseMarkValue(input.sessional3),
  ]);
}

// Practical: 3 sessionals out of 40 each. Best 2 averaged.
// Plus assignment (5) + field visit (5)
export function calculatePracticalSessional(input: PracticalSessionalInput): number | null {
  const avg = bestTwoAverage([
    parseMarkValue(input.sessional1),
    parseMarkValue(input.sessional2),
    parseMarkValue(input.sessional3),
  ]);
  if (avg === null) return null;
  return avg + (parseMarkValue(input.assignmentMarks) ?? 0) + (parseMarkValue(input.fieldVisitMarks) ?? 0);
}

// Per-subject total = Sessional(20) + Board(80)
// Pass threshold: >= 40
export function calculateSubjectResult(
  theorySessional: number | null,
  theoryBoard: number | null,
  practicalSessional: number | null,
  practicalBoard: number | null
): { theoryTotal: number | null; practicalTotal: number | null; grandTotal: number | null; status: "PASS" | "BK" } {
  const theoryTotal =
    theorySessional !== null && theoryBoard !== null
      ? theorySessional + theoryBoard
      : null;

  const practicalTotal =
    practicalSessional !== null && practicalBoard !== null
      ? practicalSessional + practicalBoard
      : null;

  // Grand total is the sum of theory and practical where applicable
  let grandTotal: number | null = null;
  if (theoryTotal !== null && practicalTotal !== null) {
    grandTotal = theoryTotal + practicalTotal;
  } else if (theoryTotal !== null) {
    grandTotal = theoryTotal;
  } else if (practicalTotal !== null) {
    grandTotal = practicalTotal;
  }

  // Each component must meet its pass threshold
  // Theory: sessional(20) + board(80) = 100, pass at 40
  // Practical: sessional(20) + board(80) = 100, pass at 40
  const theoryPass = theoryTotal === null || theoryTotal >= 40;
  const practicalPass = practicalTotal === null || practicalTotal >= 40;

  const status = theoryPass && practicalPass ? "PASS" : "BK";

  return { theoryTotal, practicalTotal, grandTotal, status };
}

// Overall result across all subjects
export function calculateOverallResult(subjectResults: SubjectResult[]): {
  overallResult: "PASS" | "PBP" | "FAIL" | "PENDING";
  backPaperCount: number;
} {
  // Filter out fixed marks subjects (Games, Discipline)
  const gradedSubjects = subjectResults.filter((s) => !s.isFixedMarks);

  // Check if all marks are entered
  const hasAllMarks = gradedSubjects.every(
    (s) => s.grandTotal !== null
  );

  if (!hasAllMarks) {
    return { overallResult: "PENDING", backPaperCount: 0 };
  }

  const backPapers = gradedSubjects.filter((s) => s.status === "BK");
  const backPaperCount = backPapers.length;

  if (backPaperCount === 0) {
    return { overallResult: "PASS", backPaperCount: 0 };
  } else if (backPaperCount <= 2) {
    return { overallResult: "PBP", backPaperCount };
  } else {
    return { overallResult: "FAIL", backPaperCount };
  }
}
