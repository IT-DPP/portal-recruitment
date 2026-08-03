"use client";

import React, { useState } from "react";
import { UserPlus, Mail, Lock, Eye, EyeOff, User, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CandidateRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      const existingCandidatesRaw = localStorage.getItem("ugz_candidates");
      const candidates = existingCandidatesRaw ? JSON.parse(existingCandidatesRaw) : [];

      const candidateExists = candidates.some((c: any) => c.email.toLowerCase() === email.toLowerCase());

      if (candidateExists) {
        setErrorMsg("Email is already registered. Please login instead.");
        setIsSubmitting(false);
        return;
      }

      const newCandidate = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        password: password, // In a real app, this should be hashed
        createdAt: new Date().toISOString()
      };

      candidates.push(newCandidate);
      localStorage.setItem("ugz_candidates", JSON.stringify(candidates));
      
      // Auto login after register
      localStorage.setItem("nexus_candidate_session", JSON.stringify({
        id: newCandidate.id,
        email: newCandidate.email
      }));

      setIsSubmitting(false);
      router.push("/candidate/jobs"); // Redirect to candidate jobs list
    }, 1000);
  };

  return (
    <div className="bg-surface-bright min-h-screen flex items-center justify-center p-4 relative font-sans overflow-hidden">
      {/* Background Decor */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#00355f 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

      <main className="relative z-10 w-full max-w-[440px]">
        <div className="bg-white border border-surface-container rounded-3xl shadow-xl shadow-primary/5 p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserPlus className="text-primary w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">Create an Account</h1>
            <p className="text-sm text-on-surface-variant">Join DPP Portal Career to apply for jobs</p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <span className="text-sm font-medium text-red-800 leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full h-12 pl-12 pr-4 bg-surface-bright border-2 border-surface-container rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create a password"
                  className="w-full h-12 pl-12 pr-12 bg-surface-bright border-2 border-surface-container rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider block" htmlFor="confirmPassword">
                Verify Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className="w-full h-12 pl-12 pr-12 bg-surface-bright border-2 border-surface-container rounded-xl text-sm font-medium text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-4 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:bg-primary-container active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm font-medium text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/candidate/login" className="text-primary hover:underline underline-offset-4 font-bold">
              Sign In here
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-surface-container flex justify-center">
             <Link href="/" className="text-xs font-bold text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors">
                Return to Home
             </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
