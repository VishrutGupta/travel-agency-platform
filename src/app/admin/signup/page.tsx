"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { authService } from "@/lib/services/authService";
import { User } from "@/lib/types";

export default function AdminSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerExists, setOwnerExists] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const countRes = await fetch("/api/auth/check-owner");
        const data = await countRes.json();
        if (data.exists) {
          setOwnerExists(true);
        }
      } catch {
        // If API fails, assume no owner (client-side check fallback)
      } finally {
        setChecking(false);
      }
    };
    checkOwner();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      await authService.signup(email, password, fullName);

      // Check if user is immediately authenticated (email confirmation may be required)
      const user = await authService.getCurrentUser();
      if (user) {
        router.push("/admin");
      } else {
        // Email confirmation required
        router.push("/admin/login?message=verify");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed.";
      if (msg.includes("already exists")) {
        setError("An account with this email already exists. Please sign in.");
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E0D8] p-8 shadow-xs my-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#1C1E21] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#6B7280]">Checking account status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (ownerExists) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center p-6 selection:bg-[#4B6B5B]/20">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E0D8] p-8 shadow-xs my-8">
          <div className="text-center mb-8">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#4B6B5B] block mb-1">
              Agency Owner Portal
            </span>
            <h1 className="text-2xl font-light text-[#1C1E21] tracking-tight">
              Account Already Exists
            </h1>
          </div>
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center mb-6">
            Owner account already exists. Please sign in.
          </div>
          <Link
            href="/admin/login"
            className="block w-full py-3 px-6 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs text-center"
          >
            <span>Go to Owner Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-xs text-[#6B7280] hover:text-[#1C1E21] transition-colors"
            >
              ← Return to public website
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Main Signup Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E0D8] p-8 shadow-xs my-8">
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#4B6B5B] block mb-1">
            Agency Owner Portal
          </span>
          <h1 className="text-2xl font-light text-[#1C1E21] tracking-tight">
            Create Owner Account
          </h1>
          <p className="text-xs text-[#6B7280] mt-1.5">
            Set up your agency owner account
          </p>
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Smith"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@agency.com"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden"
            />
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
                  <span>Create Owner Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Signin link */}
        <div className="mt-6 pt-4 border-t border-[#F0EFEA] text-center text-xs text-[#6B7280]">
          Already have an account?{" "}
          <Link
            href="/admin/login"
            className="text-[#4B6B5B] hover:text-[#1C1E21] transition-colors font-medium"
          >
            Sign in
          </Link>
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
