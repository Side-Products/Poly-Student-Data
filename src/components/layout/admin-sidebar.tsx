"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  FileEdit,
  FileText,
  Download,
  LogOut,
} from "lucide-react";

interface AdminSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Students",
      href: "/students",
      icon: Users,
    },
    {
      name: "Marks Entry",
      href: "/marks",
      icon: FileEdit,
    },
    {
      name: "Results",
      href: "/results",
      icon: FileText,
    },
    {
      name: "Export",
      href: "/export",
      icon: Download,
    },
  ];

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Portal</h1>
        <p className="text-sm text-gray-600 mt-1">Polytechnic Management</p>
      </div>

      <Separator />

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-4 space-y-4">
        <div className="px-4 py-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">
            {user.name || "Admin User"}
          </p>
          {user.email && (
            <p className="text-xs text-gray-600 mt-1">{user.email}</p>
          )}
          <div className="mt-2">
            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
              {user.role || "ADMIN"}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
