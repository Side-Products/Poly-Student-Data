export interface SessionalInput {
  sessional1: number | null;
  sessional2: number | null;
  sessional3: number | null;
}

export interface PracticalSessionalInput extends SessionalInput {
  assignmentMarks: number | null;
  fieldVisitMarks: number | null;
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

// Best 2 of 3 sessionals, averaged
function bestTwoAverage(marks: (number | null)[]): number | null {
  const valid = marks.filter((m): m is number => m !== null);
  if (valid.length < 2) return null;
  valid.sort((a, b) => b - a);
  return (valid[0] + valid[1]) / 2;
}

// Theory: 3 sessionals out of 40 each. Best 2 averaged, reduced to 20.
export function calculateTheorySessional(input: SessionalInput): number | null {
  const avg = bestTwoAverage([input.sessional1, input.sessional2, input.sessional3]);
  if (avg === null) return null;
  return avg / 2; // 40 -> 20
}

// Practical: 3 sessionals out of 80 each. Best 2 averaged, reduced to 10.
// Plus assignment (5) + field visit (5) = total 20
export function calculatePracticalSessional(input: PracticalSessionalInput): number | null {
  const avg = bestTwoAverage([input.sessional1, input.sessional2, input.sessional3]);
  if (avg === null) return null;
  const reduced = avg / 8; // 80 -> 10
  return reduced + (input.assignmentMarks ?? 0) + (input.fieldVisitMarks ?? 0);
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
