"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { FileText, Trophy, LogOut } from "lucide-react";

interface StudentNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    registrationNumber?: string | null;
  };
}

export default function StudentNav({ user }: StudentNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Application",
      href: "/application",
      icon: FileText,
    },
    {
      name: "My Results",
      href: "/my-results",
      icon: Trophy,
    },
  ];

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Student Portal
              </h1>
              <p className="text-xs text-gray-600">
                {user.name || "Student"}
                {user.registrationNumber && ` (${user.registrationNumber})`}
              </p>
            </div>

            <div className="flex gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
