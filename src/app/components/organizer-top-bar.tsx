"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LogOut } from "lucide-react";
import { signOut } from "aws-amplify/auth";

export function OrganizerTopBar() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/organizer/sign-in");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3.5">
        <Link href="/organizer/dashboard" className="flex items-center gap-2">
          <Heart className="size-5 fill-primary text-primary" />
          <span className="font-display text-lg font-bold text-foreground">
            CupidShoots<span className="text-primary">.ai</span>
          </span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground active:scale-[0.98]"
        >
          <LogOut className="size-4" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
