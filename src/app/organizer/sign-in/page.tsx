import Link from "next/link";
import { Heart } from "lucide-react";
import { OrganizerAuthForm } from "../../components/organizer-auth-form";

export default function OrganizerSignInPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Heart className="absolute left-[8%] top-[12%] size-10 rotate-[-15deg] fill-accent/20 text-accent/20" />
        <Heart className="absolute right-[10%] top-[18%] size-14 rotate-12 fill-primary/10 text-primary/10" />
        <Heart className="absolute bottom-[14%] right-[12%] size-10 rotate-6 fill-primary/10 text-primary/10" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col gap-7 rounded-[2rem] border border-border bg-card px-6 py-10 shadow-xl shadow-primary/10 sm:px-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
              <Heart className="size-8 fill-primary-foreground text-primary-foreground" />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                Organizer access
              </h1>
              <p className="text-pretty text-sm text-muted-foreground">
                Sign in to manage your CupidShoots events.
              </p>
            </div>
          </div>

          <OrganizerAuthForm />
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
          >
            Back to join an event
          </Link>
        </div>
      </div>
    </main>
  );
}
