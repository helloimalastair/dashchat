import { Hono } from "hono";
import { cookie } from "hono/cookie";
import { createRoom, identifyUser, upgradeToWebSocket } from "routes";
import { awaitReady, markReady } from "stream";

const app = new Hono<Environment>();

// Add Cookie-Parsing Middleware
app.use("*", cookie());

app.get("/hello", c => c.text("Hello World!"));

// Add Username
app.get("/identify", identifyUser);

// Create Room
app.post("/create", createRoom);

// Wait for Upload/Processing to finish
app.get("/processing/:id", awaitReady);

// Incoming Stream Processing Completion Webhooks
app.all("/processing/complete", markReady);

// Upgrade to WebSocket
app.get("/rooms/:id", upgradeToWebSocket);

// Fallback, routes requests to Pages "backend"
app.notFound(async ({req}) => await fetch(req));

export default app;
export { Room } from "Room";
export { Analytics } from "Analytics";