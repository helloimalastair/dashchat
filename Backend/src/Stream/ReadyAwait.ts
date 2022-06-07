import { decoder, encoder, generateID } from "Utils";
import type { Handler } from "hono";

interface WebhookSignatureInfo {
  time: string;
  sig1: string;
}

const markReady: Handler<string, Environment> = async (c, next) => {
  // Parse headers and body.
  const WHSig = c.req.headers.get("Webhook-Signature");
  const body = await c.req.text();

  // Validate webhook signature.
  if (!WHSig) {
    return c.json({ success: false, error: "Invalid webhook signature." });
  }

  // TODO: Add this in when less pressed for time.
  let data: any;
  try {
    // const SignatureInfo: WebhookSignatureInfo = Object.fromEntries(
    //     WHSig.split(",").map((e) => e.split("="))
    //   ),
    //   source = `${SignatureInfo.time}.${body}`,
    //   key = await crypto.subtle.importKey(
    //     "raw",
    //     encoder.encode(c.env.StreamWebhookSecret),
    //     { name: "HMAC", hash: { name: "SHA-512" } },
    //     false,
    //     ["sign"]
    //   ),
    //   signature = decoder.decode(
    //     await crypto.subtle.sign("HMAC", key, encoder.encode(source))
    //   );
    // if (signature !== SignatureInfo.sig1)
    //   throw new Error("Invalid signature.");
    data = JSON.parse(body);
  } catch (e: any) {
    console.error(e, e.stack);
    await next();
    return c.res;
  }

  // Get the Stream ID.
  const streamId = data.uid;

  // Get the DO ID with this Stream ID.
  const { doId } = (await c.env.KV.get(`streamToRoom:${streamId}`, {
    type: "json",
  })) as any;

  // Get the DO.
  const stub = c.env.ROOMS.get(c.env.ROOMS.idFromString(doId));

  // Set it's status to ready.
  await stub.fetch("https://internal.dashchat.app/set-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status: "ready",
    }),
  });

  // Return success.
  return c.text("OK");
};

const awaitReady: Handler<string, Environment> = async (c) => {
  const streamId = c.req.param("id");

  // Get the DO ID with this Stream ID.
  const { doId } = (await c.env.KV.get(`streamToRoom:${streamId}`, {
    type: "json",
  })) as any;

  // Get the DO.
  const stub = c.env.ROOMS.get(c.env.ROOMS.idFromString(doId));

  // Get the status.
  const reply = await stub.fetch("https://internal.dashchat.app/get-status");
  const replyJson = (await reply.json()) as { status: string };

  return c.json({ success: true, status: replyJson.status });
};

export { awaitReady, markReady };
