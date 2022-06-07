import { Context, Hono } from "hono";
import { cookie } from "hono/cookie";
import { createRoom, identifyUser, upgradeToWebSocket } from "routes";
import { awaitReady, markReady } from "stream";

const app = new Hono<Environment>();

const validateJson = async (
  c: Context<string, Environment>,
  next: Function
) => {
  if (c.req.headers.get("Content-Type") === "application/json") {
    await next();
  } else {
    return c.json({
      success: false,
      error: "Content-Type must be application/json",
    });
  }
};

// Add Cookie-Parsing Middleware
app.use("*", cookie());

// Add CORS
app.use("*", async (c, next) => {
  await next();
  const response = new Response(c.res.body, c.res);
  response.headers.set("Access-Control-Allow-Origin", "https://dashchat.app");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Cookie");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  return response;
});

// Options Support
app.options("*", () => new Response("", { status: 204 }));
app.get("/hello", (c) => c.text("Hello World!"));

// Add Username
app.post("/identify", validateJson, identifyUser);

// Create Room
app.post("/create", validateJson, createRoom);

// Wait for Upload/Processing to finish
app.get("/processing/:id", awaitReady);

// Incoming Stream Processing Completion Webhooks
app.all("/processing/complete", markReady);

// Upgrade to WebSocket
app.get("/rooms/:id", upgradeToWebSocket);

export default app;
export { Room } from "Room";
