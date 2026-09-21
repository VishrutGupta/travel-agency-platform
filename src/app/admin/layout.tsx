"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { authService } from "@/lib/services/authService";
import { User } from "@/lib/types";

const PUBLIC_AUTH_ROUTES = [
  "/admin/login",
  "/admin/signup",
  "/admin/forgot-password",
  "/admin/reset-password",
];

function isPublicAuthRoute(pathname: string): boolean {
  return PUBLIC_AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isPublicAuthRoute(pathname)) {
      setChecking(false);
      return;
    }

    authService.getCurrentUser().then((u: User | null) => {
      if (!u) {
        router.push("/admin/login");
      } else {
        setUser(u);
        setChecking(false);
      }
    });
  }, [pathname, router]);

  if (isPublicAuthRoute(pathname)) {
    return <>{children}</>;
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1C1E21] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#6B7280]">Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1C1E21] flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
