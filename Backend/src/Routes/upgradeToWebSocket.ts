import { generateErrorResponse } from "utils";
import type { Room } from "Room";
import type { Handler } from "hono";

const upgradeToWebSocket: Handler<string, Environment> = async (c, next) => {
  console.log("Upgrading to ws...");

  // Validate websocket header.
  const upgradeHeader = c.req.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    console.log("Invalid upgrade request.");
    return generateErrorResponse("Invalid request");
  }

  if (!c.req.cookie("uname")) {
    console.log("Missing username.");
    return generateErrorResponse("Invalid username");
  }

  // Get the room ID.
  const roomId = c.req.param("id");
  if (!roomId) {
    console.log("Invalid room ID.");
    return generateErrorResponse("Invalid room ID");
  }

  // Get the room DO.
  let stub: DurableObjectStub;
  try {
    const room = (await c.env.KV.get(`streamToRoom:${roomId}`, {
      type: "json",
    })) as { doId: string };

    stub = c.env.ROOMS.get(c.env.ROOMS.idFromString(room.doId));

    const reply = await stub.fetch("https://internal.dashchat.app/get-status");
    const jsonReply = (await reply.json()) as {
      status: string;
      numberOfConnections: number;
      streamId: string;
      ownerId: string;
    };

    if (jsonReply.status !== "ready") {
      return generateErrorResponse("Room is not ready");
    }

    // Reconstruct response to match specification for DO
    const request = new Request("https://internal.dashchat.app/connect", c.req);

    // Check if this is the owner.
    const userId = c.req.cookie("uname");

    if (userId === jsonReply.ownerId) {
      // Set the owner.
      request.headers.set("X-Owner", "true");
    }

    // Convert username cookie to a header.
    request.headers.set("X-Username", userId);

    // Send the request to the DO.
    return await stub.fetch(request);
  } catch (e: any) {
    console.error(e, e.stack);
    return generateErrorResponse("Invalid room ID");
  }
};

export { upgradeToWebSocket };
