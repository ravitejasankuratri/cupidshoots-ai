"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Plus,
  Trash2,
} from "lucide-react";

type Sender = {
  name: string;
  sticker: string;
  email: string;
};

type Compliment = {
  targetName: string;
  targetSticker: string;
  message: string;
};

const MAX_MESSAGE = 280;
const MIN_COMPLIMENTS = 3;

function emptyCompliment(): Compliment {
  return { targetName: "", targetSticker: "", message: "" };
}

export function ComplimentForm({ code }: { code: string }) {
  const [step, setStep] = useState(1);
  const [sender, setSender] = useState<Sender>({
    name: "",
    sticker: "",
    email: "",
  });
  const [compliments, setCompliments] = useState<Compliment[]>([
    emptyCompliment(),
  ]);

  const senderComplete =
    sender.name.trim() !== "" &&
    sender.sticker.trim() !== "" &&
    /\S+@\S+\.\S+/.test(sender.email);

  const completedCompliments = compliments.filter(
    (c) =>
      c.targetName.trim() !== "" &&
      c.targetSticker.trim() !== "" &&
      c.message.trim() !== "",
  );
  const completedCount = completedCompliments.length;
  const enoughCompliments = completedCount >= MIN_COMPLIMENTS;

  function updateCompliment(
    index: number,
    field: keyof Compliment,
    value: string,
  ) {
    setCompliments((prev) =>
      prev.map((c, i) =>
        i === index
          ? {
              ...c,
              [field]:
                field === "message" ? value.slice(0, MAX_MESSAGE) : value,
            }
          : c,
      ),
    );
  }

  function addCompliment() {
    setCompliments((prev) => [...prev, emptyCompliment()]);
  }

  function removeCompliment(index: number) {
    setCompliments((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enoughCompliments) return;
    // No backend yet — go straight to the confirmation screen.
    window.location.href = `/event/${code}/confirmation`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <StepIndicator step={step} />

      {step === 1 && (
        <section className="flex flex-col gap-4">
          <StepHeading
            title="About you"
            subtitle="So we know who's spreading the love."
          />
          <Field label="Your name">
            <input
              type="text"
              autoComplete="name"
              value={sender.name}
              onChange={(e) =>
                setSender((s) => ({ ...s, name: e.target.value }))
              }
              placeholder="Alex Rivera"
              className={inputClass}
            />
          </Field>
          <Field label="Your sticker number">
            <input
              type="text"
              inputMode="numeric"
              value={sender.sticker}
              onChange={(e) =>
                setSender((s) => ({
                  ...s,
                  sticker: e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
                }))
              }
              placeholder="42"
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              autoComplete="email"
              value={sender.email}
              onChange={(e) =>
                setSender((s) => ({ ...s, email: e.target.value }))
              }
              placeholder="you@email.com"
              className={inputClass}
            />
          </Field>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-4">
          <StepHeading
            title="Your compliments"
            subtitle="Add at least 3 kind, anonymous notes."
          />

          <div className="flex flex-col gap-4">
            {compliments.map((compliment, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    Compliment {index + 1}
                  </span>
                  {compliments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCompliment(index)}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition hover:text-primary"
                      aria-label={`Remove compliment ${index + 1}`}
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Their name">
                    <input
                      type="text"
                      value={compliment.targetName}
                      onChange={(e) =>
                        updateCompliment(index, "targetName", e.target.value)
                      }
                      placeholder="Jordan"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Their sticker #">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={compliment.targetSticker}
                      onChange={(e) =>
                        updateCompliment(
                          index,
                          "targetSticker",
                          e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
                        )
                      }
                      placeholder="17"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Message">
                  <textarea
                    value={compliment.message}
                    onChange={(e) =>
                      updateCompliment(index, "message", e.target.value)
                    }
                    placeholder="I loved how your laugh lit up the whole room..."
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />
                  <span className="self-end text-xs text-muted-foreground">
                    {compliment.message.length} / {MAX_MESSAGE}
                  </span>
                </Field>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCompliment}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/40 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5"
          >
            <Plus className="size-4" />
            Add another
          </button>

          <CountBadge count={completedCount} />
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-4">
          <StepHeading
            title="Review & submit"
            subtitle="Double-check before sending your compliments."
          />

          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
            <span className="font-semibold text-foreground">From</span>
            <span className="text-muted-foreground">
              {sender.name || "—"} · Sticker #{sender.sticker || "—"} ·{" "}
              {sender.email || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {completedCompliments.length === 0 && (
              <p className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                No complete compliments yet. Go back to step 2 to add some.
              </p>
            )}
            {completedCompliments.map((compliment, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-primary/5"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Heart className="size-4 fill-primary text-primary" />
                  For {compliment.targetName} · #{compliment.targetSticker}
                </span>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  {compliment.message}
                </p>
              </div>
            ))}
          </div>

          <CountBadge count={completedCount} />
        </section>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-4 text-base font-semibold text-foreground transition hover:bg-muted/50"
          >
            <ArrowLeft className="size-5" />
            Back
          </button>
        )}

        {step < 3 && (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !senderComplete}
            className="group flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            Continue
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        {step === 3 && (
          <button
            type="submit"
            disabled={!enoughCompliments}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            <Check className="size-5" />
            Submit compliments
          </button>
        )}
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 caret-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-ring/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-display text-xl font-bold text-foreground">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  const labels = ["You", "Compliments", "Review"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const index = i + 1;
        const active = index === step;
        const done = index < step;
        return (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-full transition ${
                active || done ? "bg-primary" : "bg-border"
              }`}
            />
            <span
              className={`text-xs font-medium ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  const enough = count >= MIN_COMPLIMENTS;
  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        enough
          ? "bg-green-100 text-green-700"
          : "bg-muted text-muted-foreground"
      }`}
      aria-live="polite"
    >
      {enough && <Check className="size-4" />}
      {count} / {MIN_COMPLIMENTS} compliments added
    </div>
  );
}
