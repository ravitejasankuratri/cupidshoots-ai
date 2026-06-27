import Link from "next/link";
import { Check, Heart } from "lucide-react";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const eventCode = code.toUpperCase();

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-5 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Heart className="absolute left-[10%] top-[14%] size-10 rotate-[-15deg] fill-accent/20 text-accent/20" />
        <Heart className="absolute right-[12%] top-[20%] size-14 rotate-12 fill-primary/10 text-primary/10" />
        <Heart className="absolute bottom-[16%] left-[14%] size-12 rotate-6 fill-primary/10 text-primary/10" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center gap-6 rounded-[2rem] border border-border bg-card px-6 py-12 text-center shadow-xl shadow-primary/10 sm:px-10">
          <span className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30">
            <Check className="size-10 text-primary-foreground" strokeWidth={3} />
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Compliments sent!
            </h1>
            <p className="text-pretty text-base leading-relaxed text-muted-foreground">
              Your anonymous compliments for event{" "}
              <span className="font-mono font-semibold tracking-widest text-primary">
                {eventCode}
              </span>{" "}
              are on their way. Keep an eye out — someone may have shot one your
              way too.
            </p>
          </div>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-lg font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99]"
          >
            <Heart className="size-5 fill-primary-foreground text-primary-foreground" />
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
