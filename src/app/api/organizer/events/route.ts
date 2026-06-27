export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { SchedulerClient, CreateScheduleCommand } from "@aws-sdk/client-scheduler";
import { getDbClient } from "@/lib/db";
import { verifyOrganizerToken } from "@/lib/auth";

function generateEventCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function GET(req: Request) {
  const claims = await verifyOrganizerToken(req);
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDbClient();
  try {
    const { rows: organizers } = await db.query(
      `SELECT id FROM organizers WHERE cognito_sub = $1`,
      [claims.sub]
    );
    if (!organizers.length) {
      return NextResponse.json({ events: [] });
    }
    const { rows } = await db.query(
      `SELECT e.id, e.event_code, e.event_name, e.venue, e.event_date, e.end_time, e.status,
              COUNT(DISTINCT s.id) AS submission_count,
              COUNT(DISTINCT m.id) AS match_count
       FROM events e
       LEFT JOIN submissions s ON s.event_id = e.id
       LEFT JOIN matches m ON m.event_id = e.id
       WHERE e.organizer_id = $1
       GROUP BY e.id
       ORDER BY e.created_at DESC`,
      [organizers[0].id]
    );
    return NextResponse.json({ events: rows });
  } finally {
    await db.end();
  }
}

export async function POST(req: Request) {
  const claims = await verifyOrganizerToken(req);
  if (!claims) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { event_name: string; venue?: string; event_date: string; end_time: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_name, venue, event_date, end_time } = body;
  if (!event_name?.trim() || !event_date || !end_time) {
    return NextResponse.json({ error: "event_name, event_date, and end_time are required" }, { status: 400 });
  }

  const db = await getDbClient();
  try {
    // Upsert organizer row
    const { rows: [organizer] } = await db.query(
      `INSERT INTO organizers (cognito_sub, email, name)
       VALUES ($1, $2, $3)
       ON CONFLICT (cognito_sub) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [claims.sub, claims.email ?? "", claims["name"] ?? ""]
    );

    // Generate unique event code (retry on collision)
    let eventCode = "";
    let eventId = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      eventCode = generateEventCode();
      try {
        const { rows: [event] } = await db.query(
          `INSERT INTO events (organizer_id, event_code, event_name, venue, event_date, end_time)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [organizer.id, eventCode, event_name.trim(), venue?.trim() || null, event_date, end_time]
        );
        eventId = event.id;
        break;
      } catch (err: unknown) {
        const pgErr = err as { code?: string };
        if (pgErr.code !== "23505") throw err; // only retry on unique violation
      }
    }

    if (!eventId) {
      return NextResponse.json({ error: "Failed to generate unique event code" }, { status: 500 });
    }

    // Schedule Lambda via EventBridge Scheduler
    const scheduler = new SchedulerClient({ region: process.env.AWS_REGION || "us-east-1" });
    const endDate = new Date(end_time);
    await scheduler.send(new CreateScheduleCommand({
      Name: `process-event-${eventId}`,
      ScheduleExpression: `at(${endDate.toISOString().slice(0, 19)})`,
      Target: {
        Arn: process.env.MATCH_PROCESSOR_LAMBDA_ARN!,
        RoleArn: process.env.SCHEDULER_ROLE_ARN!,
        Input: JSON.stringify({ event_id: eventId }),
      },
      FlexibleTimeWindow: { Mode: "OFF" },
      ActionAfterCompletion: "DELETE",
    }));

    return NextResponse.json({ event_id: eventId, event_code: eventCode }, { status: 201 });
  } finally {
    await db.end();
  }
}
