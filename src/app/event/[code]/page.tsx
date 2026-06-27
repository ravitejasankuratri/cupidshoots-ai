import Link from "next/link";
import { Heart } from "lucide-react";
import { ComplimentForm } from "../../components/compliment-form";

export default async function EventPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const eventCode = code.toUpperCase();

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
              Give your compliments
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
