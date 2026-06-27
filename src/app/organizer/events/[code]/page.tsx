"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, MapPin, Sparkles, Users } from "lucide-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { OrganizerTopBar } from "@/app/components/organizer-top-bar";
import { EventCodeDisplay } from "@/app/components/event-code-display";
import { CloseEventButton } from "@/app/components/close-event-button";

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

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const [event, setEvent] = useState<Event | null>(null);
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
        const res = await fetch(`/api/organizer/events/${params.code}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          router.push("/organizer/sign-in");
          return;
        }
        if (res.status === 404) {
          router.push("/organizer/dashboard");
          return;
        }
        setEvent(await res.json());
      } catch {
        router.push("/organizer/dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router, params.code]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col">
        <OrganizerTopBar />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  if (!event) return null;

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
            {event.event_name}
          </h1>
          <span className={`mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>

        <div className="mt-6">
          <EventCodeDisplay code={event.event_code} />
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
            {new Date(event.event_date).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-2.5 text-foreground">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            Ends at {new Date(event.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-5">
            <Users className="size-5 text-primary" />
            <span className="mt-1 text-2xl font-bold text-foreground">{event.submission_count}</span>
            <span className="text-sm text-muted-foreground">Submissions</span>
          </div>
          <div className="flex flex-col gap-1 rounded-3xl border border-border bg-card p-5">
            <Sparkles className="size-5 text-primary" />
            <span className="mt-1 text-2xl font-bold text-foreground">{event.match_count}</span>
            <span className="text-sm text-muted-foreground">Matches</span>
          </div>
        </div>

        {event.status === "active" && (
          <div className="mt-6">
            <CloseEventButton eventId={event.id} />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Closing the event stops new submissions and starts matching.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
