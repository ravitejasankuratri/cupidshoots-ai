import Link from "next/link";
import { CalendarDays, Heart, MapPin, Plus, Sparkles, Users } from "lucide-react";
import { OrganizerTopBar } from "@/app/components/organizer-top-bar";
import {
  formatEventDate,
  formatTime,
  mockEvents,
  statusConfig,
} from "@/app/organizer/mock-events";

export default function OrganizerDashboardPage() {
  const events = mockEvents;

  return (
    <div className="flex min-h-dvh flex-col">
      <OrganizerTopBar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Your Events
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your mixers and watch the matches roll in.
            </p>
          </div>
        </div>

        <Link
          href="/organizer/events/new"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99]"
        >
          <Plus className="size-5" />
          Create Event
        </Link>

        {events.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-[2rem] border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <Heart className="size-7 fill-primary/70 text-primary/70" />
            </span>
            <p className="text-pretty text-base font-medium text-foreground">
              No events yet. Create your first event!
            </p>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {events.map((event) => {
              const status = statusConfig[event.status];
              return (
                <li key={event.id}>
                  <Link
                    href={`/organizer/events/${event.code}`}
                    className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md active:scale-[0.995]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-pretty text-lg font-semibold leading-snug text-foreground">
                          {event.name}
                        </h2>
                        <span className="font-mono text-sm font-medium tracking-widest text-primary">
                          {event.code}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="size-4 shrink-0" />
                        {formatEventDate(event.date)} · ends {formatTime(event.endTime)}
                      </span>
                      {event.venue && (
                        <span className="flex items-center gap-2">
                          <MapPin className="size-4 shrink-0" />
                          {event.venue}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 border-t border-border pt-3 text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Users className="size-4 text-muted-foreground" />
                        {event.submissionCount}
                        <span className="font-normal text-muted-foreground">
                          submissions
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Sparkles className="size-4 text-muted-foreground" />
                        {event.matchCount}
                        <span className="font-normal text-muted-foreground">
                          matches
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
