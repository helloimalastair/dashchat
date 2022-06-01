import { generateErrorResponse, usernameDoesNotExist } from "utils";
import type { Room } from "Room";
import type { Handler } from "hono";

const upgradeToWebSocket: Handler<string, Environment> = async (c, next) => {
  const upgradeHeader = c.req.headers.get("Upgrade");
  // If request is not a WebSocket request, pass it to the next handler
  if (!upgradeHeader || upgradeHeader !== "websocket") return fetch(c.req);
  // Username must be set BEFORE connecting to WebSocket
  if(!c.req.cookie("uname")) return usernameDoesNotExist();
  // Attempt to locate room
  const room = await c.env.KV.get<Room>(`${c.env.KVPrefix}-rooms-${c.req.param("id")}`, {type: "json"});
  // If room does not exist, return Room-Specific 404 Error
  if(!room) return generateErrorResponse("Room does not exist", 404);
  // If room exists, check if room is locked
  if(room.status !== "open") return generateErrorResponse(`Room is ${room.status}`, 403);
  // Reconstruct response to match specification for DO
  const request = new Request(`${c.env.InternalURL}/connect`, c.req);
  // If user has id matching owner, add owner header
  if (room.ids.owner=== c.req.cookie("userId")) request.headers.set("isOwner", "true");
  // Convert uname cookie to header
  request.headers.set("uname", c.req.cookie("uname"));
  return await c.env.ROOMS.get(c.env.ROOMS.idFromString(room.ids.do)).fetch(request);
};

export { upgradeToWebSocket };