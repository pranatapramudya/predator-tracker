import { after, NextResponse } from "next/server";

import {
  detectWebhookSource,
  processWebhookPayload,
  verifyWebhookRequest,
} from "../../../lib/webhooks/processors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!rawBody) {
    return NextResponse.json({ error: "Empty webhook body." }, { status: 400 });
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const source = detectWebhookSource(payload);

  if (!source) {
    return NextResponse.json({ error: "Unsupported webhook payload." }, { status: 400 });
  }

  const isAuthorized = verifyWebhookRequest({
    source,
    headers: request.headers,
    rawBody,
  });

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized webhook request." }, { status: 401 });
  }

  after(async () => {
    try {
      await processWebhookPayload(source, payload);
    } catch (error) {
      console.error("Failed to process webhook payload:", error);
    }
  });

  return NextResponse.json(
    {
      ok: true,
      source,
    },
    { status: 200 },
  );
}
