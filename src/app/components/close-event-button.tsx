"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";

export function CloseEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    if (closing) return;
    setClosing(true);
    setError(null);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (!token) {
        router.push("/organizer/sign-in");
        return;
      }

      const res = await fetch(`/api/organizer/events/${eventId}/close`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to close event.");
        setClosing(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setClosing(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClose}
        disabled={closing}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-4 text-base font-semibold text-destructive transition hover:bg-destructive/15 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Lock className="size-5" />
        {closing ? "Closing event…" : "Close Event Now"}
      </button>
      {error && (
        <p className="text-center text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
