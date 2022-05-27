import type { Handler } from "hono";

const upgrade: Handler<string, Environment> = async (c, next) => {
  const upgradeHeader = c.req.headers.get("Upgrade");
  // If request is not a WebSocket request, pass it to the next handler
  if (!upgradeHeader || upgradeHeader !== "websocket") return fetch(c.req);
  // Username must be set BEFORE connecting to WebSocket
  if(!c.req.cookie("uname")) {
    c.status(400);
    return c.text("No username cookie found");
  }
  // Attempt to locate room
  const room = await c.env.KV.get<Room>(`${c.env.KVPrefix}-rooms-${c.req.param("id")}`, {type: "json"});
  // If room does not exist, return Room-Specific 404 Error
  if(!room) {
    c.status(404);
    return c.text("Room not found");
  }
  // If room exists, check if room is locked
  if(room.status !== "open") {
    c.status(403);
    return c.text(`Room is ${room.status}`);
  }
  // Reconstruct response to match specification for DO
  const request = new Request(c.req.url, c.req);
  // If user has id matching owner, add owner header
  if (room.ownerId === c.req.cookie("userId")) request.headers.set("isOwner", "true");
  // Convert uname cookie to header
  request.headers.set("uname", c.req.cookie("uname"));
  return await c.env.ROOMS.get(c.env.ROOMS.idFromString(room.doId)).fetch(request);
};

export default upgrade;