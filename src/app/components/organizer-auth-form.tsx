"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

type Mode = "sign-in" | "sign-up";

export function OrganizerAuthForm() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignUp = mode === "sign-up";

  const isValid =
    /\S+@\S+\.\S+/.test(email) &&
    password.length >= 8 &&
    (!isSignUp || name.trim() !== "");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    // Auth wiring (AWS Amplify + Cognito) to be added later.
    // For now this is UI only.
  }

  function switchMode(next: Mode) {
    setMode(next);
    setPassword("");
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
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
            <span className="text-xs text-muted-foreground">
              At least 8 characters.
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={!isValid}
          className="group mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {isSignUp ? "Create account" : "Sign In"}
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </form>

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
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 caret-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/20";
