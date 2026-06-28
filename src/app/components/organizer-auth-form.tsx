"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { signIn, signOut, signUp, confirmSignUp } from "aws-amplify/auth";

type Mode = "sign-in" | "sign-up" | "confirm";

export function OrganizerAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "sign-up";
  const isConfirm = mode === "confirm";

  const isValid = isConfirm
    ? code.trim().length === 6
    : /\S+@\S+\.\S+/.test(email) &&
      password.length >= 8 &&
      (!isSignUp || name.trim() !== "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || loading) return;
    setLoading(true);
    setError(null);

    try {
      if (isConfirm) {
        await confirmSignUp({ username: email, confirmationCode: code });
        // After confirmation, sign in automatically
        await signIn({ username: email, password });
        router.push("/organizer/dashboard");
        return;
      }

      if (isSignUp) {
        await signUp({
          username: email,
          password,
          options: { userAttributes: { name, email } },
        });
        setMode("confirm");
        return;
      }

      // Sign out any stale session before signing in
      try { await signOut(); } catch { /* no active session */ }
      const result = await signIn({ username: email, password });
      if (result.isSignedIn) {
        router.push("/organizer/dashboard");
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: "sign-in" | "sign-up") {
    setMode(next);
    setPassword("");
    setError(null);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {isConfirm && (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm text-foreground">
          Check your email for a confirmation code and enter it below.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        {isConfirm ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Confirmation code</span>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className={inputClass}
              autoFocus
            />
          </label>
        ) : (
          <>
            {isSignUp && (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Name</span>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className={inputClass}
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Password</span>
              <input
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
              {isSignUp && (
                <span className="text-xs text-muted-foreground">At least 8 characters.</span>
              )}
            </label>
          </>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!isValid || loading}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {loading
            ? "Please wait…"
            : isConfirm
            ? "Verify"
            : isSignUp
            ? "Create account"
            : "Sign In"}
          {!loading && <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />}
        </button>
      </form>

      {!isConfirm && (
        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={() => switchMode(isSignUp ? "sign-in" : "sign-up")}
            className="font-semibold text-primary underline-offset-4 transition hover:underline"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 caret-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/20";
