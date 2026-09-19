"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { authService } from "@/lib/services/authService";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authService.login(email, password);
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log in.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center p-6 selection:bg-[#4B6B5B]/20">
      {/* Top logo */}
      <div className="pt-8 sm:pt-12">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-[#1C1E21] text-white flex items-center justify-center">
            <Compass className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-semibold tracking-tight text-[#1C1E21] text-base">
            Alpine & Co. Expeditions
          </span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E0D8] p-8 shadow-xs my-8">
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#4B6B5B] block mb-1">
            Agency Owner Portal
          </span>
          <h1 className="text-2xl font-light text-[#1C1E21] tracking-tight">
            Owner Login
          </h1>
          <p className="text-xs text-[#6B7280] mt-1.5">
            Manage journeys, brochures, and agency settings
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@agency.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-75"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Auth status links */}
        <div className="mt-6 pt-4 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-[#6B7280]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase Auth — email/password only</span>
          </div>
          <div className="mt-3 text-xs text-[#6B7280]">
            Don't have an owner account?{" "}
            <Link
              href="/admin/signup"
              className="text-[#4B6B5B] hover:text-[#1C1E21] transition-colors font-medium"
            >
              Create owner account
            </Link>
          </div>
          <div className="mt-4 pt-4 border-t border-[#F0EFEA] text-center text-xs text-[#6B7280]">
            <span>
              <Link
                href="/admin/forgot-password"
                className="text-[#4B6B5B] hover:text-[#1C1E21] transition-colors"
              >
                Forgot password?
              </Link>
            </span>
          </div>
        </div>
      </div>

      {/* Return link */}
      <div className="pb-8 text-center">
        <Link
          href="/"
          className="text-xs text-[#6B7280] hover:text-[#1C1E21] transition-colors"
        >
          ← Return to public website
        </Link>
      </div>
    </div>
  );
}
