import { Hono } from "hono";
import { cookie } from "hono/cookie";
import { createRoom, identifyUser, upgradeToWebSocket } from "routes";
import { awaitReady } from "Stream";

const app = new Hono<Environment>();

// Add Cookie-Parsing Middleware
app.use("/rooms", cookie());

// Add Username
app.get("/identify", identifyUser);

// Create Room
app.post("/create", createRoom);

// Wait for Upload/Processing to finish
app.get("/processing/:id", awaitReady);

// Upgrade to WebSocket
app.get("/rooms/:id", upgradeToWebSocket);

// Fallback, routes requests to Pages "backend"
app.all("/*", async ({req}) => fetch(req));

export default app;
export { Room } from "Room";
export { Analytics } from "Analytics";