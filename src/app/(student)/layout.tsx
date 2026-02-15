import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import StudentNav from "@/components/layout/student-nav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "STUDENT") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav user={session.user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
