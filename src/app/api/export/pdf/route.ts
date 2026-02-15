import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await auth();
    if (
      !session?.user ||
      (session.user as { role: string }).role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const search = searchParams.get("search");

    // If search param is provided, return student list for the search dropdown
    if (search) {
      const year = searchParams.get("year");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: Record<string, any> = {
        OR: [
          { name: { contains: search } },
          { registrationNumber: { contains: search } },
        ],
      };
      if (year) {
        where.yearSemester = year;
      }

      const students = await prisma.student.findMany({
        where,
        select: {
          id: true,
          name: true,
          registrationNumber: true,
        },
        take: 10,
        orderBy: { name: "asc" },
      });

      return NextResponse.json({ students });
    }

    // Otherwise generate the printable HTML for a specific student
    if (!studentId) {
      return NextResponse.json(
        { error: "Missing studentId parameter" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        addresses: true,
        qualifications: {
          orderBy: { level: "asc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const html = generateStudentHTML(student);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatBoolean(val: boolean | null): string {
  if (val === null || val === undefined) return "-";
  return val ? "Yes" : "No";
}

function formatYear(val: string): string {
  return val === "FIRST_YEAR" ? "First Year" : "Second Year";
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "-";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateStudentHTML(student: any): string {
  const correspondenceAddr = student.addresses?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => a.type === "CORRESPONDENCE"
  );
  const permanentAddr = student.addresses?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any) => a.type === "PERMANENT"
  );

  const qualificationRows = (student.qualifications || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((q: any) => {
      return `
        <tr>
          <td>${escapeHtml(q.level?.replace(/_/g, " "))}</td>
          <td>${escapeHtml(q.courseName)}</td>
          <td>${escapeHtml(q.boardUniversity)}</td>
          <td>${q.passingYear || "-"}</td>
          <td>${q.marksObtained ?? "-"}</td>
          <td>${q.maxMarks ?? "-"}</td>
          <td>${escapeHtml(q.percentageGrade)}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Student Application - ${escapeHtml(student.name)} (${escapeHtml(student.registrationNumber)})</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
      padding: 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    .header h1 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .header p {
      font-size: 13px;
      color: #555;
    }

    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 13px;
      font-weight: bold;
      background: #f0f0f0;
      padding: 6px 10px;
      border: 1px solid #ccc;
      border-bottom: none;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid #ccc;
    }

    .info-item {
      display: flex;
      border-bottom: 1px solid #ddd;
      border-right: 1px solid #ddd;
    }

    .info-item:nth-child(even) {
      border-right: none;
    }

    .info-label {
      font-weight: 600;
      background: #fafafa;
      padding: 5px 8px;
      min-width: 140px;
      border-right: 1px solid #ddd;
      font-size: 11px;
    }

    .info-value {
      padding: 5px 8px;
      flex: 1;
      font-size: 11px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .full-width .info-item {
      border-right: none;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #ccc;
    }

    table th {
      background: #f0f0f0;
      font-weight: 600;
      text-align: left;
      padding: 5px 8px;
      border: 1px solid #ccc;
      font-size: 11px;
    }

    table td {
      padding: 5px 8px;
      border: 1px solid #ddd;
      font-size: 11px;
    }

    .address-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border: 1px solid #ccc;
    }

    .address-block {
      padding: 8px;
      border-right: 1px solid #ddd;
    }

    .address-block:last-child {
      border-right: none;
    }

    .address-block h4 {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 6px;
      text-decoration: underline;
    }

    .address-block p {
      font-size: 11px;
      margin-bottom: 2px;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
    }

    .status-submitted {
      background: #dcfce7;
      color: #166534;
    }

    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #888;
      border-top: 1px solid #ccc;
      padding-top: 10px;
    }

    .signature-area {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      padding: 0 40px;
    }

    .signature-line {
      text-align: center;
      font-size: 11px;
    }

    .signature-line .line {
      border-top: 1px solid #333;
      width: 180px;
      margin-bottom: 4px;
    }

    @media print {
      body {
        padding: 0;
        font-size: 11px;
      }

      .container {
        max-width: 100%;
      }

      .no-print {
        display: none !important;
      }

      @page {
        margin: 15mm;
        size: A4;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 16px;">
    <button onclick="window.print()" style="padding: 8px 24px; font-size: 14px; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 6px;">
      Print / Save as PDF
    </button>
  </div>

  <div class="container">
    <div class="header">
      <h1>Student Application Form</h1>
      <p>Registration Number: <strong>${escapeHtml(student.registrationNumber)}</strong></p>
      <p>
        Status:
        <span class="status-badge ${student.isSubmitted ? "status-submitted" : "status-pending"}">
          ${student.isSubmitted ? "Submitted" : "Pending"}
        </span>
        ${student.submittedAt ? ` on ${formatDate(student.submittedAt.toISOString())}` : ""}
      </p>
    </div>

    <!-- Basic Information -->
    <div class="section">
      <div class="section-title">Basic Information</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Name</div>
          <div class="info-value">${escapeHtml(student.name)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Father's Name</div>
          <div class="info-value">${escapeHtml(student.fatherName)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Registration No.</div>
          <div class="info-value">${escapeHtml(student.registrationNumber)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Roll Number</div>
          <div class="info-value">${escapeHtml(student.rollNumber)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Year / Semester</div>
          <div class="info-value">${formatYear(student.yearSemester)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Group / Shift</div>
          <div class="info-value">${escapeHtml(student.groupShift)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date of Birth</div>
          <div class="info-value">${escapeHtml(student.dateOfBirth)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Gender</div>
          <div class="info-value">${escapeHtml(student.gender)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Category</div>
          <div class="info-value">${escapeHtml(student.category)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Sub Category</div>
          <div class="info-value">${escapeHtml(student.subCategory)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Nationality</div>
          <div class="info-value">${escapeHtml(student.nationality)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Aadhar Number</div>
          <div class="info-value">${escapeHtml(student.aadharNumber)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Mobile Number</div>
          <div class="info-value">${escapeHtml(student.mobileNumber)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Landline Number</div>
          <div class="info-value">${escapeHtml(student.landlineNumber)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${escapeHtml(student.email)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Fee Submitted</div>
          <div class="info-value">${escapeHtml(student.feeSubmitted)}</div>
        </div>
      </div>
    </div>

    <!-- Institute & Branch -->
    <div class="section">
      <div class="section-title">Institute Details</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Institute Name</div>
          <div class="info-value">${escapeHtml(student.instituteName)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Branch Name</div>
          <div class="info-value">${escapeHtml(student.branchName)}</div>
        </div>
      </div>
    </div>

    <!-- Admission Details -->
    <div class="section">
      <div class="section-title">Admission Details</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Admission Type</div>
          <div class="info-value">${escapeHtml(student.admissionType)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Student Type</div>
          <div class="info-value">${escapeHtml(student.studentType?.replace(/_/g, " "))}</div>
        </div>
        <div class="info-item">
          <div class="info-label">JEEP Roll Number</div>
          <div class="info-value">${escapeHtml(student.jeepRollNumber)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">JEEP Rank</div>
          <div class="info-value">${escapeHtml(student.jeepRank)}</div>
        </div>
      </div>
    </div>

    <!-- Education Background -->
    <div class="section">
      <div class="section-title">Education Background</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">High School Pass</div>
          <div class="info-value">${formatBoolean(student.highSchoolPass)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Intermediate Pass</div>
          <div class="info-value">${formatBoolean(student.intermediatePass)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">High School Area</div>
          <div class="info-value">${escapeHtml(student.highSchoolAreaType)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">ITI Pass</div>
          <div class="info-value">${formatBoolean(student.itiPass)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Minority</div>
          <div class="info-value">${formatBoolean(student.minority)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Inter PCB/PCM</div>
          <div class="info-value">${formatBoolean(student.interQualifiedPCBPCM)}</div>
        </div>
      </div>
    </div>

    <!-- Transfer Details (if applicable) -->
    ${
      student.studentType === "TRANSFERRED" || student.studentType === "STUDY_PERMISSION"
        ? `
    <div class="section">
      <div class="section-title">Transfer / Study Permission Details</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Transfer From</div>
          <div class="info-value">${escapeHtml(student.transferFromCollege)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Transfer To</div>
          <div class="info-value">${escapeHtml(student.transferToCollege)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Study Perm. From</div>
          <div class="info-value">${escapeHtml(student.studyPermFromCollege)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Study Perm. To</div>
          <div class="info-value">${escapeHtml(student.studyPermToCollege)}</div>
        </div>
      </div>
    </div>
    `
        : ""
    }

    <!-- Addresses -->
    <div class="section">
      <div class="section-title">Addresses</div>
      <div class="address-grid">
        <div class="address-block">
          <h4>Correspondence Address</h4>
          ${
            correspondenceAddr
              ? `
          <p><strong>Address:</strong> ${escapeHtml(correspondenceAddr.address)}</p>
          <p><strong>District:</strong> ${escapeHtml(correspondenceAddr.district)}</p>
          <p><strong>Tehsil:</strong> ${escapeHtml(correspondenceAddr.tehsil)}</p>
          <p><strong>Block:</strong> ${escapeHtml(correspondenceAddr.block)}</p>
          <p><strong>State:</strong> ${escapeHtml(correspondenceAddr.state)}</p>
          <p><strong>Pin Code:</strong> ${escapeHtml(correspondenceAddr.pinCode)}</p>
          `
              : "<p>Not provided</p>"
          }
        </div>
        <div class="address-block">
          <h4>Permanent Address</h4>
          ${
            permanentAddr
              ? `
          <p><strong>Address:</strong> ${escapeHtml(permanentAddr.address)}</p>
          <p><strong>District:</strong> ${escapeHtml(permanentAddr.district)}</p>
          <p><strong>Tehsil:</strong> ${escapeHtml(permanentAddr.tehsil)}</p>
          <p><strong>Block:</strong> ${escapeHtml(permanentAddr.block)}</p>
          <p><strong>State:</strong> ${escapeHtml(permanentAddr.state)}</p>
          <p><strong>Pin Code:</strong> ${escapeHtml(permanentAddr.pinCode)}</p>
          `
              : "<p>Not provided</p>"
          }
        </div>
      </div>
    </div>

    <!-- Qualifications -->
    ${
      student.qualifications && student.qualifications.length > 0
        ? `
    <div class="section">
      <div class="section-title">Qualification Details</div>
      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Course</th>
            <th>Board / University</th>
            <th>Year</th>
            <th>Marks</th>
            <th>Max Marks</th>
            <th>%/Grade</th>
          </tr>
        </thead>
        <tbody>
          ${qualificationRows}
        </tbody>
      </table>
    </div>
    `
        : ""
    }

    <!-- Signature Area -->
    <div class="signature-area">
      <div class="signature-line">
        <div class="line"></div>
        Student's Signature
      </div>
      <div class="signature-line">
        <div class="line"></div>
        Principal's Signature
      </div>
    </div>

    <div class="footer">
      Generated on ${new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })} | Poly Student Data Management System
    </div>
  </div>

  <script>
    // Auto-trigger print on load
    window.onload = function() {
      // Small delay to ensure styles are loaded
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;
}
