export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const db = await getDbClient();
  try {
    const { rows } = await db.query(
      `SELECT id, event_name, event_date, status FROM events WHERE event_code = $1`,
      [code.toUpperCase()]
    );
    if (!rows.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const event = rows[0];
    if (event.status === "completed") {
      return NextResponse.json({ error: "Event has ended" }, { status: 410 });
    }
    return NextResponse.json({
      event_id: event.id,
      event_name: event.event_name,
      event_date: event.event_date,
      status: event.status,
    });
  } finally {
    await db.end();
  }
}
