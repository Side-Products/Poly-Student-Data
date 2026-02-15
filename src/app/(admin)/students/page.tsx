"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getStudents } from "@/actions/student.actions";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Student = {
  id: string;
  registrationNumber: string;
  rollNumber: string | null;
  name: string;
  yearSemester: string;
  isSubmitted: boolean;
};

export default function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [yearFilter, setYearFilter] = useState(
    searchParams.get("year") || "all"
  );

  useEffect(() => {
    loadStudents();
  }, [search, yearFilter]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {};
      if (search) params.search = search;
      if (yearFilter !== "all") params.year = yearFilter;

      const result = await getStudents(params);
      setStudents(result.students as Student[]);
    } catch (error) {
      console.error("Failed to load students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`/students?${params.toString()}`);
  };

  const handleYearChange = (value: string) => {
    setYearFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value !== "all") {
      params.set("year", value);
    } else {
      params.delete("year");
    }
    router.push(`/students?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600 mt-2">
          Manage and view all student records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name, registration number, or roll number..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="w-64">
              <Select value={yearFilter} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="FIRST_YEAR">First Year</SelectItem>
                  <SelectItem value="SECOND_YEAR">Second Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Students List{" "}
            <span className="text-gray-500 font-normal">
              ({students.length} records)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No students found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reg Number</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.registrationNumber}
                    </TableCell>
                    <TableCell>{student.rollNumber || "-"}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {student.yearSemester?.replace(/_/g, " ") || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.isSubmitted ? (
                        <Badge className="bg-green-600">Submitted</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/students/${student.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/students/${student.id}/marks`}>
                          <Button variant="outline" size="sm">
                            Marks
                          </Button>
                        </Link>
                        <Link href={`/students/${student.id}/result`}>
                          <Button variant="outline" size="sm">
                            Result
                          </Button>
                        </Link>
                      </div>
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
