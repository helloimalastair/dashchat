import { broadcast, sendJson } from "./utils";
import type { Room } from ".";

const decoder = new TextDecoder(),
  errorGenerator = (m: string) =>
    JSON.stringify({ time: Date.now(), type: "error", message: m }),
  systemGenerator = (m: string) =>
    JSON.stringify({ time: Date.now(), type: "system", message: m });

export default async function handleMessage(
  room: Room,
  conn: Connection,
  event: MessageEvent
): Promise<void> {
  // Parse the payload.
  let payload: RoomCommunication;
  try {
    payload = JSON.parse(event.data as string);
  } catch (e) {
    return sendJson(conn, { error: "Invalid/Unparseable JSON" });
  }

  const handler = {
    ping: async () => {
      sendJson(conn, { type: "pong", data: {} });
    },
    sendMessage: async () => {
      broadcast(
        room.connections,
        { type: "receiveMessage", data: { message: payload.data.message } },
        conn
      );
    },
  }[payload.type];

  if (!handler) {
    sendJson(conn, { error: "Invalid/Unrecognized type" });
    return;
  } else {
    try {
      await handler();
    } catch (e: any) {
      sendJson(conn, { error: e.message });
    }
  }
}
