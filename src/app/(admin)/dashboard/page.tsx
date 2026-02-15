import { prisma } from "@/lib/prisma";
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
import Link from "next/link";

async function getDashboardStats() {
  const [totalStudents, submittedApplications, firstYearCount, secondYearCount] =
    await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { isSubmitted: true } }),
      prisma.student.count({ where: { yearSemester: "FIRST_YEAR" } }),
      prisma.student.count({ where: { yearSemester: "SECOND_YEAR" } }),
    ]);

  return { totalStudents, submittedApplications, firstYearCount, secondYearCount };
}

async function getRecentSubmissions() {
  return prisma.student.findMany({
    where: { isSubmitted: true },
    orderBy: { submittedAt: "desc" },
    take: 10,
    select: {
      id: true,
      registrationNumber: true,
      rollNumber: true,
      name: true,
      yearSemester: true,
      submittedAt: true,
    },
  });
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recentSubmissions = await getRecentSubmissions();

  const statCards = [
    { title: "Total Students", value: stats.totalStudents, color: "text-blue-600" },
    { title: "Submitted Applications", value: stats.submittedApplications, color: "text-green-600" },
    { title: "First Year Students", value: stats.firstYearCount, color: "text-purple-600" },
    { title: "Second Year Students", value: stats.secondYearCount, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of student data and applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSubmissions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No submissions yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg Number</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSubmissions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.registrationNumber}</TableCell>
                    <TableCell>{s.rollNumber || "-"}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.yearSemester.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.submittedAt
                        ? new Date(s.submittedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Link href={`/students/${s.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
