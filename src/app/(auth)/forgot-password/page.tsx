"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border/80 bg-card/85 backdrop-blur-md p-8 shadow-2xl font-sans">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Forgot Password
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your email address to receive a one-time password recovery code
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="text-sm text-foreground">
              If an account is registered with <span className="font-mono text-primary font-bold">{email}</span>, a password reset code has been sent.
            </p>
            <p className="text-xs text-muted-foreground">
              Please check your inbox or spam folder. The code expires in 15 minutes.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="w-full rounded-md bg-primary py-2 text-xs font-bold font-display text-primary-foreground hover:opacity-90 text-center glow-primary"
              >
                PROCEED TO RESET PASSWORD
              </Link>
              <Link
                href="/login"
                className="text-xs text-muted-foreground hover:text-foreground text-center mt-1"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-bold font-display text-primary-foreground hover:opacity-90 transition-opacity tracking-wider disabled:opacity-50 glow-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  Send Reset Code
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs text-muted-foreground mt-4">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
