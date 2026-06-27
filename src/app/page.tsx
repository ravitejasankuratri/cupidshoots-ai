import { Heart } from "lucide-react";
import { JoinEventForm } from "./components/join-event-form";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* Soft decorative hearts */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Heart className="absolute left-[8%] top-[12%] size-10 rotate-[-15deg] fill-accent/20 text-accent/20" />
        <Heart className="absolute right-[10%] top-[18%] size-14 rotate-12 fill-primary/10 text-primary/10" />
        <Heart className="absolute bottom-[14%] left-[12%] size-12 rotate-6 fill-primary/10 text-primary/10" />
        <Heart className="absolute bottom-[10%] right-[14%] size-8 rotate-[-10deg] fill-accent/20 text-accent/20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center gap-7 rounded-[2rem] border border-border bg-card px-6 py-10 text-center shadow-xl shadow-primary/10 sm:px-10">
          {/* Brand */}
          <div className="flex flex-col items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <Heart className="size-8 fill-primary-foreground text-primary-foreground" />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                CupidShoots
                <span className="text-primary">.ai</span>
              </h1>
              <p className="text-pretty text-base text-muted-foreground">
                Anonymous compliments. Real connections.
              </p>
            </div>
          </div>

          {/* Form */}
          <JoinEventForm />

          {/* Helper text */}
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            Got compliments to give? Enter your event code above.
          </p>
        </div>

        {/* Organizer link */}
        <div className="mt-6 text-center">
          <a
            href="/organizer/sign-in"
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
          >
            Organizer? Sign in here
          </a>
        </div>
      </div>
    </main>
  );
}
