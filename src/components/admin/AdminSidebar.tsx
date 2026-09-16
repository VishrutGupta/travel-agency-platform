"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  Map,
  PlusCircle,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { authService } from "@/lib/services/authService";

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/admin/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "All Trips", href: "/admin/trips", icon: Map },
    { label: "Add New Trip", href: "/admin/trips/new", icon: PlusCircle },
    { label: "Agency Settings", href: "/admin/settings", icon: Settings },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-5 bg-[#1C1E21] text-white">
      <div>
        {/* Brand */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight block">
                Alpine Portal
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest">
                Owner Dashboard
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white font-semibold shadow-2xs"
                    : "text-stone-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-stone-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer controls */}
      <div className="pt-6 border-t border-white/10 flex flex-col gap-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-stone-300 hover:bg-white/5 transition-colors"
        >
          <span>View Public Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/40 transition-colors w-full text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header with toggle */}
      <header className="md:hidden sticky top-0 z-30 bg-[#1C1E21] text-white p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-sm">Owner Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex">
          <div className="w-72 h-full bg-[#1C1E21]">
            {sidebarContent}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
};
