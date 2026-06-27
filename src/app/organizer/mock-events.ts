export type EventStatus = "active" | "processing" | "completed";

export type OrganizerEvent = {
  id: string;
  code: string;
  name: string;
  venue: string | null;
  date: string; // ISO date (YYYY-MM-DD)
  endTime: string; // HH:mm (24h)
  status: EventStatus;
  submissionCount: number;
  matchCount: number;
};

export const mockEvents: OrganizerEvent[] = [
  {
    id: "1",
    code: "GLOW24",
    name: "Friday Night Singles Mixer",
    venue: "The Velvet Room, Austin",
    date: "2026-07-03",
    endTime: "23:00",
    status: "active",
    submissionCount: 48,
    matchCount: 0,
  },
  {
    id: "2",
    code: "SPARK7",
    name: "Rooftop Summer Social",
    venue: "Skyline Terrace, Dallas",
    date: "2026-06-21",
    endTime: "22:30",
    status: "processing",
    submissionCount: 112,
    matchCount: 0,
  },
  {
    id: "3",
    code: "CUPID1",
    name: "Speed Connections After Dark",
    venue: "Lumen Lounge, Houston",
    date: "2026-05-14",
    endTime: "21:00",
    status: "completed",
    submissionCount: 87,
    matchCount: 19,
  },
];

export const statusConfig: Record<
  EventStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-green-100 text-green-700 ring-1 ring-green-600/20",
  },
  processing: {
    label: "Processing",
    className: "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20",
  },
  completed: {
    label: "Completed",
    className: "bg-muted text-muted-foreground ring-1 ring-border",
  },
};

export function getEvent(code: string): OrganizerEvent | undefined {
  return mockEvents.find((e) => e.code.toUpperCase() === code.toUpperCase());
}

export function formatEventDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}
