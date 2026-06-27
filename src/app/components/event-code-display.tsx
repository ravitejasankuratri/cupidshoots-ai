"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function EventCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable; ignore.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy event code ${code}`}
      className="group flex w-full flex-col items-center gap-3 rounded-3xl border border-border bg-gradient-to-b from-primary/5 to-accent/5 px-6 py-8 text-center transition hover:border-primary/40 active:scale-[0.99]"
    >
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Event Code
      </span>
      <span className="font-mono text-5xl font-bold tracking-[0.3em] text-foreground sm:text-6xl">
        {code}
      </span>
      <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
        {copied ? (
          <>
            <Check className="size-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="size-4" />
            Tap to copy
          </>
        )}
      </span>
    </button>
  );
}
