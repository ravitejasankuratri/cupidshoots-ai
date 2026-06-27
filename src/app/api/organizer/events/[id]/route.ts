import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";
import { verifyOrganizerToken } from "@/lib/auth";

export async function GET(
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
      `SELECT e.id, e.event_code, e.event_name, e.venue, e.event_date, e.end_time, e.status,
              COUNT(DISTINCT s.id) AS submission_count,
              COUNT(DISTINCT m.id) AS match_count
       FROM events e
       JOIN organizers o ON o.id = e.organizer_id AND o.cognito_sub = $2
       LEFT JOIN submissions s ON s.event_id = e.id
       LEFT JOIN matches m ON m.event_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [id, claims.sub]
    );
    if (!rows.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } finally {
    await db.end();
  }
}
