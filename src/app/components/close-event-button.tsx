"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export function CloseEventButton() {
  const [closing, setClosing] = useState(false);

  function handleClose() {
    if (closing) return;
    setClosing(true);
    // Backend wiring (close event + trigger matching) to be added later.
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      disabled={closing}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-4 text-base font-semibold text-destructive transition hover:bg-destructive/15 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Lock className="size-5" />
      {closing ? "Closing event…" : "Close Event Now"}
    </button>
  );
}
