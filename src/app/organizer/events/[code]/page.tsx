import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { OrganizerTopBar } from "@/app/components/organizer-top-bar";
import { EventCodeDisplay } from "@/app/components/event-code-display";
import { CloseEventButton } from "@/app/components/close-event-button";
import {
  formatEventDate,
  formatTime,
  getEvent,
  statusConfig,
} from "@/app/organizer/mock-events";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const event = getEvent(code);

  if (!event) {
    notFound();
  }

  const status = statusConfig[event.status];

  return (
    <div className="flex min-h-dvh flex-col">
      <OrganizerTopBar />

      <main className="mx-auto w-full max-w-md flex-1 px-5 py-6">
        <Link
          href="/organizer/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <div className="mt-5 flex items-start justify-between gap-3">
          <h1 className="text-pretty font-display text-2xl font-bold leading-snug text-foreground">
            {event.name}
          </h1>
          <span
            className={`mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <div className="mt-6">
          <EventCodeDisplay code={event.code} />
        </div>

        <div className="mt-4 flex flex-col gap-2.5 rounded-3xl border border-border bg-card p-5 text-sm">
          {event.venue && (
            <span className="flex items-center gap-2.5 text-foreground">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              {event.venue}
            </span>
          )}
          <span className="flex items-center gap-2.5 text-foreground">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            {formatEventDate(event.date)}
          </span>
          <span className="flex items-center gap-2.5 text-foreground">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            Ends at {formatTime(event.endTime)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-5">
            <Users className="size-5 text-primary" />
            <span className="mt-1 text-2xl font-bold text-foreground">
              {event.submissionCount}
            </span>
            <span className="text-sm text-muted-foreground">Submissions</span>
          </div>
          <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-5">
            <Sparkles className="size-5 text-primary" />
            <span className="mt-1 text-2xl font-bold text-foreground">
              {event.matchCount}
            </span>
            <span className="text-sm text-muted-foreground">Matches</span>
          </div>
        </div>

        {event.status === "active" && (
          <div className="mt-6">
            <CloseEventButton />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Closing the event stops new submissions and starts matching.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
