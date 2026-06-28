"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Heart, MapPin, Plus, Sparkles, Users } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { OrganizerTopBar } from "@/app/components/organizer-top-bar";

type Event = {
  id: string;
  event_code: string;
  event_name: string;
  venue: string | null;
  event_date: string;
  end_time: string;
  status: "active" | "processing" | "completed";
  submission_count: number;
  match_count: number;
};

const statusConfig = {
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  processing: { label: "Processing", className: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", className: "bg-gray-100 text-gray-500" },
};

export default function OrganizerDashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (!token) {
          router.push("/organizer/sign-in");
          return;
        }
        const res = await fetch("/api/organizer/events", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push("/organizer/sign-in");
          return;
        }
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        // Only redirect on auth errors, not network/API errors
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col">
      <OrganizerTopBar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Your Events</h1>
          <p className="text-sm text-muted-foreground">
            Manage your mixers and watch the matches roll in.
          </p>
        </div>

        <Link
          href="/organizer/events/new"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99]"
        >
          <Plus className="size-5" />
          Create Event
        </Link>

        {loading ? (
          <div className="mt-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : events.length === 0 ? (
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
                    href={`/organizer/events/${event.id}`}
                    className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md active:scale-[0.995]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-pretty text-lg font-semibold leading-snug text-foreground">
                          {event.event_name}
                        </h2>
                        <span className="font-mono text-sm font-medium tracking-widest text-primary">
                          {event.event_code}
                        </span>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="size-4 shrink-0" />
                        {new Date(event.event_date).toLocaleDateString()} · ends {new Date(event.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
                        {event.submission_count}
                        <span className="font-normal text-muted-foreground">submissions</span>
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        <Sparkles className="size-4 text-muted-foreground" />
                        {event.match_count}
                        <span className="font-normal text-muted-foreground">matches</span>
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
