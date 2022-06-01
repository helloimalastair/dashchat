import { decoder, encoder, generateID } from "Utils";
import type { Handler } from "hono";

interface WebhookSignatureInfo {
  time: string;
  sig1: string;
}


const markReady: Handler<string, Environment> = async (c, next) => {
    if(c.req.headers.get("content-type") !== "application/json") {
      await next();
      return c.res;
    }
    const WHSig = c.req.headers.get("Webhook-Signature"),
      body = await c.req.text();
    if(!WHSig) {
      await next();
      return c.res;
    }
    let data: any;
    try {
      const SignatureInfo: WebhookSignatureInfo = Object.fromEntries(WHSig.split(",").map(e => e.split("="))),
        source = `${SignatureInfo.time}.${body}`,
        key = await crypto.subtle.importKey("raw", encoder.encode(c.env.StreamWebhookSecret), {name: "HMAC", hash: {name: "SHA-512"}}, false, ["sign"]),
        signature = decoder.decode(await crypto.subtle.sign("HMAC", key, encoder.encode(source)));
      if(signature !== SignatureInfo.sig1) throw new Error("");
      data = JSON.parse(body);
    } catch(e) {
      await next();
      return c.res;
    }
    await c.env.KV.put(`${c.env.KVPrefix}-ProcessingComplete-${generateID(data.uid)}`, "true");
    return c.text("OK");
  },
  awaitReady: Handler<string, Environment> = async c => {
    const isDone = await c.env.KV.get<boolean>(`${c.env.KVPrefix}-ProcessingComplete-${c.req.param("id")}`, { type: "json" });
    if(isDone === null) {
      c.status(404);
      return c.text("Video ID not recognized");
    }
    return c.text(isDone ? "true" : "false");
  };

export { awaitReady, markReady };