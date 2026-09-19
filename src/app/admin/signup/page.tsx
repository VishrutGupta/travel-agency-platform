"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Compass, Lock, Mail, ArrowRight, Eye, EyeOff, Check } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

interface PasswordRequirement {
  label: string
  test: (pw: string) => boolean
}

const REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /\d/.test(pw) },
  { label: "One special character", test: (pw) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw) },
]

function getPasswordStrength(pw: string): "Weak" | "Fair" | "Strong" {
  if (!pw) return "Weak"
  const passes = REQUIREMENTS.filter((r) => r.test(pw)).length
  if (passes <= 2) return "Weak"
  if (passes <= 4) return "Fair"
  return "Strong"
}

function strengthColor(s: "Weak" | "Fair" | "Strong"): string {
  switch (s) {
    case "Weak": return "bg-red-500"
    case "Fair": return "bg-amber-500"
    case "Strong": return "bg-emerald-500"
  }
}

export default function AdminSignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ownerExists, setOwnerExists] = useState(false)
  const [checking, setChecking] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const signupLock = useRef(false)

  const passwordStrength = getPasswordStrength(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword
  const allRequirementsPass = REQUIREMENTS.every((r) => r.test(password))

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const countRes = await fetch("/api/auth/check-owner")
        const data = await countRes.json()
        if (data.exists) {
          setOwnerExists(true)
        }
      } catch {
        // If API fails, assume no owner
      } finally {
        setChecking(false)
      }
    }
    checkOwner()
  }, [])

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {}
    const trimmedName = fullName.trim()
    const trimmedEmail = email.trim()

    if (!trimmedName || trimmedName.length < 2) {
      errors.fullName = "Full name is required (at least 2 characters)."
    }
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address."
    }
    if (!password || !PASSWORD_RE.test(password)) {
      errors.password = "Password does not meet the required security requirements."
    }
    if (!confirmPassword || !passwordsMatch) {
      errors.confirmPassword = "Passwords do not match."
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }, [fullName, email, password, confirmPassword, passwordsMatch])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signupLock.current) return
    setError(null)
    setFieldErrors({})

    if (!validate()) return

    signupLock.current = true
    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, fullName: fullName.trim() }),
      })

      const data = await response.json()

      console.error("[signup] Response status:", response.status)
      console.error("[signup] Response data:", JSON.stringify(data))

      if (!response.ok) {
        if (data.error === "over_email_send_rate_limit") {
          setError("Too many verification emails have been requested. Please wait a while and try again.")
        } else if (response.status === 403) {
          setError("An owner account already exists. Please sign in.")
        } else if (data.error === "weak_password") {
          setError("Your password does not meet the required security requirements.")
        } else if (data.error === "user_already_exists") {
          setError("An account with this email already exists. Please sign in.")
        } else if (data.error === "email_not_confirmed") {
          setError("Please verify your email address before signing in.")
        } else if (data.message) {
          setError(data.message)
        } else if (data.error) {
          setError(data.error)
        } else {
          setError("Account creation failed. Please try again.")
        }
        setLoading(false)
        signupLock.current = false
        return
      }

      signupLock.current = false
      const requiresConfirmation = data.requiresEmailConfirmation
      if (requiresConfirmation) {
        router.push("/admin/login?message=verify")
      } else {
        router.push("/admin")
      }
    } catch (err) {
      console.error("[signup] Fetch error:", err)
      setError("Account creation failed. Please try again.")
      setLoading(false)
      signupLock.current = false
    }
  }

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
    )
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
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-center items-center p-6 selection:bg-[#4B6B5B]/20">
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
              className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden ${
                fieldErrors.fullName ? "border-red-400" : "border-[#E5E0D8]"
              }`}
            />
            {fieldErrors.fullName && (
              <span className="text-[11px] text-red-500 mt-0.5">{fieldErrors.fullName}</span>
            )}
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
              className={`w-full px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden ${
                fieldErrors.email ? "border-red-400" : "border-[#E5E0D8]"
              }`}
            />
            {fieldErrors.email && (
              <span className="text-[11px] text-red-500 mt-0.5">{fieldErrors.email}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden ${
                  fieldErrors.password ? "border-red-400" : "border-[#E5E0D8]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B6B5B] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <span className="text-[11px] text-red-500 mt-0.5">{fieldErrors.password}</span>
            )}

            {password.length > 0 && (
              <div className="mt-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthColor(passwordStrength)}`}
                      style={{
                        width:
                          passwordStrength === "Weak" ? "33%" : passwordStrength === "Fair" ? "66%" : "100%",
                      }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${
                    passwordStrength === "Weak" ? "text-red-500" :
                    passwordStrength === "Fair" ? "text-amber-600" : "text-emerald-600"
                  }`}>
                    {passwordStrength}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-0.5">
                  {REQUIREMENTS.map((req) => (
                    <div key={req.label} className="flex items-center gap-1">
                      <Check
                        className={`w-3 h-3 ${req.test(password) ? "text-emerald-500" : "text-gray-300"}`}
                      />
                      <span className={`text-[11px] ${req.test(password) ? "text-emerald-600" : "text-gray-400"}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-xs sm:text-sm font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden ${
                  fieldErrors.confirmPassword ? "border-red-400" : "border-[#E5E0D8]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B6B5B] transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword.length > 0 && (
              <span className={`text-[11px] mt-0.5 ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                {passwordsMatch ? "Passwords match" : "Passwords do not match"}
              </span>
            )}
            {fieldErrors.confirmPassword && (
              <span className="text-[11px] text-red-500 mt-0.5">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-75"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Owner Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

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

      <div className="pb-8 text-center">
        <Link
          href="/"
          className="text-xs text-[#6B7280] hover:text-[#1C1E21] transition-colors"
        >
          ← Return to public website
        </Link>
      </div>
    </div>
  )
}
