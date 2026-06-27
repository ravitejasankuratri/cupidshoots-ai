import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { verifyOrganizerToken } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const claims = await verifyOrganizerToken(req);
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getDbClient();
  try {
    // Verify the event belongs to this organizer
    const { rows } = await db.query(
      `SELECT e.id FROM events e
       JOIN organizers o ON o.id = e.organizer_id AND o.cognito_sub = $2
       WHERE e.id = $1 AND e.status = 'active'`,
      [id, claims.sub]
    );
    if (!rows.length) {
      return NextResponse.json({ error: "Event not found or already closed" }, { status: 404 });
    }

    // Trigger the internal process-matches endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/internal/process-matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": process.env.INTERNAL_API_KEY!,
      },
      body: JSON.stringify({ event_id: id }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to trigger match processing" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } finally {
    await db.end();
  }
}
