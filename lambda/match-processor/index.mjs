/**
 * CupidShoots.ai — Match Processor Lambda
 * Triggered by EventBridge Scheduler at event end_time.
 * Calls back into the Next.js API to do the heavy lifting
 * (DB queries, Bedrock poems, SES emails) so DB creds stay out of Lambda.
 */
export const handler = async (event) => {
  const { event_id } = event;

  if (!event_id) {
    throw new Error("Missing event_id in event payload");
  }

  const url = `${process.env.APP_URL}/api/internal/process-matches`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": process.env.INTERNAL_API_KEY,
    },
    body: JSON.stringify({ event_id }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`process-matches failed: ${res.status} ${body}`);
  }

  const result = await res.json();
  console.log("Match processing complete:", result);
  return result;
};
