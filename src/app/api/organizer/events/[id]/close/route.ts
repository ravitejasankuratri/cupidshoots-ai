export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { verifyOrganizerToken } from "@/lib/auth";
import { processMatches } from "@/lib/process-matches";

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
    const { rows } = await db.query(
      `SELECT e.id FROM events e
       JOIN organizers o ON o.id = e.organizer_id AND o.cognito_sub = $2
       WHERE e.id = $1 AND e.status = 'active'`,
      [id, claims.sub]
    );
    if (!rows.length) {
      return NextResponse.json({ error: "Event not found or already closed" }, { status: 404 });
    }
  } finally {
    await db.end();
  }

  const result = await processMatches(id);
  return NextResponse.json({ success: true, ...result });
}
