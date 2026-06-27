"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Sparkles } from "lucide-react";

export function CreateEventForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [endTime, setEndTime] = useState("");

  const isValid = name.trim() !== "" && date !== "" && endTime !== "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    // Backend wiring to be added later. For now, return to the dashboard.
    router.push("/organizer/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Event Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Friday Night Singles Mixer"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">
          Venue{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="The Velvet Room, Austin"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Event Date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">End Time</span>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={!isValid}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        <Sparkles className="size-5" />
        Create Event
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 caret-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/20";
