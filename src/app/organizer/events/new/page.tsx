import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrganizerTopBar } from "@/app/components/organizer-top-bar";
import { CreateEventForm } from "@/app/components/create-event-form";

export default function NewEventPage() {
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

        <div className="mt-5 flex flex-col gap-1">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Create Event
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up a new mixer. You can share the code with guests once it&apos;s
            live.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <CreateEventForm />
        </div>
      </main>
    </div>
  );
}
