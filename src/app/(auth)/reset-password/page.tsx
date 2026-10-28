"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [codeOrToken, setCodeOrToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");
    if (emailParam) setEmail(emailParam);
    if (tokenParam) setCodeOrToken(tokenParam);
  }, [searchParams]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passphrases do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          codeOrToken: codeOrToken.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Password reset failed.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-border/80 bg-card/80 backdrop-blur-md p-8 shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/30 mb-3">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold font-mono text-foreground">
          OVERWRITE PASSPHRASE
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Provide the one-time recovery code or token and establish a new secure key
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-destructive/15 border border-destructive/30 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <p className="text-sm text-foreground">
            Passphrase successfully updated! All prior active sessions have been revoked.
          </p>
          <p className="text-xs text-muted-foreground">
            Redirecting to sign-in terminal in 3 seconds...
          </p>
          <Link
            href="/login"
            className="inline-block mt-4 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground font-mono"
          >
            Sign In Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              COMMUNICATION CHANNEL (EMAIL)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@domain.com"
              className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              RECOVERY OTP OR RESET TOKEN
            </label>
            <input
              type="text"
              required
              value={codeOrToken}
              onChange={(e) => setCodeOrToken(e.target.value)}
              placeholder="6-digit code or hex reset token"
              className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              NEW PASSPHRASE
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              CONFIRM NEW PASSPHRASE
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new passphrase"
              className="w-full rounded-md bg-secondary/60 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity font-mono tracking-wider disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                UPDATING PASSPHRASE...
              </>
            ) : (
              <>
                CONFIRM NEW PASSPHRASE
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-center font-mono text-xs text-muted-foreground">Loading recovery parameters...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
