import { Hono } from "hono";
import { cookie } from "hono/cookie";
import Identify from "./Identify";
import WSUpgrade from "./WSUpgrade";

const app = new Hono<Environment>();

// Add Cookie-Parsing Middleware
app.use("/rooms", cookie());

// Add Username
app.get("/identify", Identify);

// Create Room


// Upgrade to WebSocket
app.get("/rooms/:id", WSUpgrade);

// Fallback, routes requests to Pages "backend"
app.all("/*", async ({req}) => fetch(req));

export default app;

export { Room } from "./Room";