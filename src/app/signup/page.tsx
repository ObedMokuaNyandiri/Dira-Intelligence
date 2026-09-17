"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, UserCheck, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("General Counsel / Legal Director");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roles = [
    "Legal Counsel / Advocate",
    "Compliance & Risk Officer",
    "Data Protection Officer (DPO)",
    "Executive / Senior Management",
    "IT / Technology Lead (CTO/CIO)",
    "Policy & Regulatory Analyst",
    "Consultant / Advisor",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password || !organization) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (!agreed) {
      setError("Please agree to the Terms of Service to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          organization,
          role,
          password,
          jurisdiction: "Republic of Kenya / EAC"
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed. Verify information.");
      }

      // Store authenticated session
      if (typeof window !== "undefined") {
        localStorage.setItem("dira_auth_user", JSON.stringify(data.user));
        if (data.session) {
          localStorage.setItem("dira_auth_token", data.session.access_token);
        }
      }

      router.push("/");
    } catch (err: any) {
      setError(err?.message || "Connection error during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] text-neutral-100 flex flex-col justify-between font-sans selection:bg-[#C8A97E]/30 selection:text-white">
      
      {/* Top Header */}
      <header className="w-full border-b border-[#1A1A1A] bg-[#000000] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-[#111111] border border-[#242424] flex items-center justify-center">
            <Scale className="w-4 h-4 text-[#C8A97E]" />
          </div>
          <span className="font-bold tracking-wider text-sm text-white">
            DIRA INTELLIGENCE
          </span>
        </Link>
        <Link 
          href="/login" 
          className="text-xs font-medium text-[#C8A97E] hover:underline"
        >
          Sign In &rarr;
        </Link>
      </header>

      {/* Main Registration Card */}
      <main className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 py-8">
        <div className="w-full max-w-lg bg-[#0A0A0A] border border-[#222222] rounded-2xl p-7 sm:p-9 shadow-2xl">
          
          <div className="text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-[#111111] border border-[#262626] flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-5 h-5 text-[#C8A97E]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Create Your Account
            </h1>
            <p className="text-sm text-neutral-300 mt-2">
              Sign up to access verified Kenyan legal and regulatory compliance answers.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#1E0E11] border border-[#8A232D] flex items-start gap-3 text-left">
              <AlertCircle className="w-4 h-4 text-[#FF6B72] shrink-0 mt-0.5" />
              <p className="text-xs text-[#FF6B72] leading-relaxed font-medium">
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
            
            {/* Full Name Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-neutral-100">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alice Kariuki"
                className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#333333] text-white text-sm placeholder:text-neutral-400 focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E] focus:outline-none transition-all"
              />
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-neutral-100">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alice@company.co.ke"
                className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#333333] text-white text-sm placeholder:text-neutral-400 focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E] focus:outline-none transition-all"
              />
            </div>

            {/* Organization / Company */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-neutral-100">
                Organization / Ministry / Company
              </label>
              <input
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Ministry of ICT, Central Bank, Safaricom"
                className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#333333] text-white text-sm placeholder:text-neutral-400 focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E] focus:outline-none transition-all"
              />
            </div>

            {/* Role Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-neutral-100">
                Role / Job Title
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#333333] text-white text-sm focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E] focus:outline-none transition-all cursor-pointer"
              >
                {roles.map((r, idx) => (
                  <option key={idx} value={r} className="bg-[#141414] text-white py-1">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-neutral-100">
                  Password (6+ chars)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#333333] text-white text-sm placeholder:text-neutral-400 focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E] focus:outline-none transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-neutral-100">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-[#333333] text-white text-sm placeholder:text-neutral-400 focus:border-[#C8A97E] focus:ring-1 focus:ring-[#C8A97E] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <label className="flex items-start gap-3 mt-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded bg-[#141414] border-[#444444] text-[#C8A97E] focus:ring-[#C8A97E] cursor-pointer"
              />
              <span className="text-xs text-neutral-300 group-hover:text-white leading-relaxed">
                I agree to use this platform for lawful legal research and compliance analysis.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-3.5 bg-[#C8A97E] hover:bg-[#D4BA96] text-[#000000] font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-[#1C1C1C] flex flex-col items-center gap-2.5 text-xs">
            <p className="text-neutral-300">
              Already have an account?{" "}
              <Link href="/login" className="text-[#C8A97E] font-semibold hover:underline">
                Sign In
              </Link>
            </p>
            <Link href="/" className="text-neutral-400 hover:text-neutral-200 transition-colors">
              &larr; Back to Home
            </Link>
          </div>

        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full py-4 text-center border-t border-[#141414] text-xs text-neutral-500">
        <span>&copy; {new Date().getFullYear()} Dira Intelligence. Kenya Legal & Regulatory Assistant.</span>
      </footer>

    </div>
  );
}
