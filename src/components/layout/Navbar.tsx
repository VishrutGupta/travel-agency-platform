"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu, X, Sparkles, Phone } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { authService } from "@/lib/services/authService";
import { Agency } from "@/lib/types";

interface NavbarProps {
  onOpenAssistant?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant }) => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agency, setAgency] = useState<Agency | null>(null);

  useEffect(() => {
    authService.getAgency().then(setAgency);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Trips", href: "/trips" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ];

  const handleOpenAssistant = () => {
    setMobileMenuOpen(false);
    if (onOpenAssistant) {
      onOpenAssistant();
    } else {
      window.dispatchEvent(new CustomEvent("open-travel-assistant"));
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
          isScrolled
            ? "bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#E5E0D8]/60 shadow-xs py-3.5"
            : "bg-transparent py-5"
        )}
      >
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 text-[#1C1E21] hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1C1E21] text-white flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4 text-emerald-400 group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-sm sm:text-base leading-none">
                {agency?.name.split(" ")[0] || "Alpine"}
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#6B7280]">
                Expeditions
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-[#1C1E21]",
                    isActive ? "text-[#1C1E21] font-semibold" : "text-[#4B5563]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Travel Assistant & Admin Link */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={handleOpenAssistant}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white border border-[#E5E0D8] text-xs font-semibold text-[#1C1E21] shadow-xs hover:shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#4B6B5B]" />
              <span>Travel Assistant</span>
            </button>

            <Link
              href="/admin"
              className="text-xs text-[#6B7280] hover:text-[#1C1E21] font-medium transition-colors ml-2"
              title="Agency Owner Dashboard"
            >
              Owner Portal
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-3">
            <button
              type="button"
              onClick={handleOpenAssistant}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E5E0D8] text-xs font-medium text-[#1C1E21] shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-[#4B6B5B]" />
              <span>Assistant</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-[#1C1E21] hover:bg-black/5"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden bg-[#FAF9F6] pt-24 px-6 pb-8 flex flex-col justify-between animate-fade-in">
          <nav className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-xl font-light text-[#1C1E21] hover:text-[#4B6B5B] transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={handleOpenAssistant}
              className="mt-4 flex items-center justify-between p-4 rounded-xl bg-white border border-[#E5E0D8] text-left shadow-xs"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#4B6B5B]" />
                <div>
                  <div className="text-sm font-semibold text-[#1C1E21]">
                    Rule-Based Travel Assistant
                  </div>
                  <div className="text-xs text-[#6B7280]">
                    Find trips matching your dates & budget
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-[#4B6B5B]">Open →</span>
            </button>
          </nav>

          <div className="pt-8 border-t border-[#E5E0D8] flex flex-col gap-4">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm text-[#6B7280] hover:text-[#1C1E21] font-medium"
            >
              Owner Admin Portal →
            </Link>
            <p className="text-xs text-[#9CA3AF]">
              © {new Date().getFullYear()} {agency?.name || "Alpine & Co."}. All rights reserved.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
