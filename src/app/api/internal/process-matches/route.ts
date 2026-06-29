export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { processMatches } from "@/lib/process-matches";

export async function POST(req: Request) {
  const internalKey = req.headers.get("x-internal-key");
  if (internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { event_id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_id } = body;
  if (!event_id) {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }

  const result = await processMatches(event_id);
  return NextResponse.json(result);
}
