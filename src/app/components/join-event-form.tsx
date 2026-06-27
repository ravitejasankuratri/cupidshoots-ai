"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

export function JoinEventForm() {
  const [code, setCode] = useState("");
  const isValid = code.length === 6;

  function handleChange(value: string) {
    const cleaned = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    setCode(cleaned);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    // Navigate to the event once the code is entered.
    window.location.href = `/event/${code}`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="event-code" className="sr-only">
          Event code
        </label>
        <input
          id="event-code"
          name="event-code"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="ABC123"
          value={code}
          onChange={(e) => handleChange(e.target.value)}
          aria-label="6 character event code"
          className="w-full rounded-2xl border border-border bg-muted/40 py-5 text-center font-mono text-3xl font-semibold uppercase tracking-[0.4em] text-foreground placeholder:text-muted-foreground/50 caret-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/20 sm:text-4xl"
          maxLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        Join Event
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
      </button>
    </form>
  );
}
