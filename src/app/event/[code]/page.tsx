import Link from "next/link";
import { Heart } from "lucide-react";
import { ComplimentForm } from "../../components/compliment-form";
import { getDbClient } from "@/lib/db";

export default async function EventPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const eventCode = code.toUpperCase();

  // Validate event code directly via DB
  let event: { id: string; event_name: string; event_date: string; status: string } | null = null;
  let errorMessage = "";
  let isEnded = false;

  try {
    const db = await getDbClient();
    try {
      const { rows } = await db.query(
        `SELECT id, event_name, event_date, status FROM events WHERE event_code = $1`,
        [eventCode]
      );
      if (rows.length) {
        if (rows[0].status === "completed") {
          isEnded = true;
          errorMessage = "This event has already ended.";
        } else {
          event = rows[0];
        }
      } else {
        errorMessage = "Event not found. Check your code and try again.";
      }
    } finally {
      await db.end();
    }
  } catch {
    errorMessage = "Unable to load event. Please try again.";
  }

  if (!event) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-border bg-card px-6 py-10 text-center shadow-xl shadow-primary/10">
          <Heart className="mx-auto mb-4 size-10 text-primary/40" />
          <h1 className="mb-2 font-display text-2xl font-bold text-foreground">
            {isEnded ? "Event Ended" : "Event Not Found"}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">{errorMessage}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105"
          >
            Try another code
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-5 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            <Heart className="size-4 fill-primary text-primary" />
            CupidShoots<span className="text-primary">.ai</span>
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {event.event_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Event code{" "}
              <span className="font-mono font-semibold tracking-widest text-primary">
                {eventCode}
              </span>
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-[2rem] border border-border bg-card p-5 shadow-xl shadow-primary/10 sm:p-7">
          <ComplimentForm code={eventCode} />
        </div>
      </div>
    </main>
  );
}
