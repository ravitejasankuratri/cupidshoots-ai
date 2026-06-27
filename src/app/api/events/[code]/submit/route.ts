import { NextResponse } from "next/server";
import { getDbClient } from "@/lib/db";

interface ComplimentInput {
  to_name: string;
  to_number: number;
  message: string;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  let body: {
    attendee_name: string;
    attendee_number: number;
    attendee_email: string;
    compliments: ComplimentInput[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { attendee_name, attendee_number, attendee_email, compliments } = body;

  if (
    !attendee_name?.trim() ||
    !attendee_number ||
    !attendee_email?.trim() ||
    !Array.isArray(compliments) ||
    compliments.length < 3
  ) {
    return NextResponse.json(
      { error: "Name, sticker number, email, and at least 3 compliments are required" },
      { status: 400 }
    );
  }

  for (const c of compliments) {
    if (Number(c.to_number) === Number(attendee_number)) {
      return NextResponse.json(
        { error: "You cannot compliment yourself" },
        { status: 400 }
      );
    }
  }

  const db = await getDbClient();
  try {
    const { rows: events } = await db.query(
      `SELECT id, status FROM events WHERE event_code = $1`,
      [code.toUpperCase()]
    );
    if (!events.length) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const event = events[0];
    if (event.status !== "active") {
      return NextResponse.json({ error: "Event is not accepting submissions" }, { status: 410 });
    }

    const { rows: existing } = await db.query(
      `SELECT id FROM submissions WHERE event_id = $1 AND attendee_number = $2`,
      [event.id, attendee_number]
    );
    if (existing.length) {
      return NextResponse.json(
        { error: "You already submitted for this event!" },
        { status: 409 }
      );
    }

    const { rows: [submission] } = await db.query(
      `INSERT INTO submissions (event_id, attendee_name, attendee_number, attendee_email, compliment_count)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [event.id, attendee_name.trim(), attendee_number, attendee_email.trim(), compliments.length]
    );

    for (const c of compliments) {
      await db.query(
        `INSERT INTO compliments (submission_id, event_id, from_number, to_name, to_number, message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [submission.id, event.id, attendee_number, c.to_name.trim(), c.to_number, c.message.trim()]
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } finally {
    await db.end();
  }
}
