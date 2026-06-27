import { NextResponse } from "next/server";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getDbClient } from "@/lib/db";

async function generatePoem(
  bedrock: BedrockRuntimeClient,
  fromName: string,
  toName: string,
  message: string
): Promise<string> {
  const prompt = `You are a romantic poet. Someone named ${fromName} left this message for ${toName} at a singles event: "${message}". Transform this into a short, warm, playful love poem (4-6 lines). Address it to ${toName}. Sign it "— Your Secret Admirer, ${fromName}". Return only the poem.`;

  const response = await bedrock.send(
    new InvokeModelCommand({
      modelId: "anthropic.claude-haiku-20240307-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    })
  );

  const result = JSON.parse(Buffer.from(response.body).toString());
  return result.content[0].text;
}

async function sendMatchEmail(
  ses: SESClient,
  to: string,
  toName: string,
  fromName: string,
  poem: string
) {
  await ses.send(
    new SendEmailCommand({
      Source: process.env.FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: `You have a match, ${toName}!` },
        Body: {
          Html: {
            Data: `
              <h2>It's a match, ${toName}!</h2>
              <p>${fromName} also left you a compliment — and we turned it into something special:</p>
              <blockquote style="font-style:italic; font-size:1.1em; border-left:3px solid #e91e63; padding-left:1em;">
                ${poem.replace(/\n/g, "<br/>")}
              </blockquote>
              <p style="color:#888; font-size:0.8em;">Powered by CupidShoots.ai</p>
            `,
          },
        },
      },
    })
  );
}

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

  const db = await getDbClient();
  try {
    await db.query(`UPDATE events SET status = 'processing' WHERE id = $1`, [event_id]);

    const { rows: matches } = await db.query(
      `SELECT DISTINCT
        s1.id AS sub_a_id, s1.attendee_name AS name_a, s1.attendee_email AS email_a,
        s2.id AS sub_b_id, s2.attendee_name AS name_b, s2.attendee_email AS email_b,
        c1.message AS msg_a_to_b,
        c2.message AS msg_b_to_a
       FROM compliments c1
       JOIN compliments c2
         ON c1.event_id = c2.event_id
        AND c1.from_number = c2.to_number
        AND c1.to_number   = c2.from_number
       JOIN submissions s1 ON s1.event_id = c1.event_id AND s1.attendee_number = c1.from_number
       JOIN submissions s2 ON s2.event_id = c1.event_id AND s2.attendee_number = c2.from_number
       WHERE c1.event_id = $1 AND c1.from_number < c2.from_number`,
      [event_id]
    );

    const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
    const ses = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });

    for (const match of matches) {
      const poem_for_a = await generatePoem(bedrock, match.name_b, match.name_a, match.msg_b_to_a);
      const poem_for_b = await generatePoem(bedrock, match.name_a, match.name_b, match.msg_a_to_b);

      await db.query(
        `INSERT INTO matches (event_id, person_a_submission, person_b_submission, poem_for_a, poem_for_b, emails_sent)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [event_id, match.sub_a_id, match.sub_b_id, poem_for_a, poem_for_b]
      );

      await sendMatchEmail(ses, match.email_a, match.name_a, match.name_b, poem_for_a);
      await sendMatchEmail(ses, match.email_b, match.name_b, match.name_a, poem_for_b);
    }

    await db.query(`UPDATE events SET status = 'completed' WHERE id = $1`, [event_id]);

    return NextResponse.json({ matches_found: matches.length });
  } finally {
    await db.end();
  }
}
