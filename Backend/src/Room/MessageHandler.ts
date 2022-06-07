import { broadcast, sendJson } from "./utils";
import type { Room } from ".";

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
      const message = {
        sender: conn.uname,
        timestamp: Date.now(),
        message: payload.data.message,
      };
      broadcast(
        room.connections,
        {
          type: "receiveMessage",
          data: message,
        },
        conn
      );
      room.messages.push(message);
    },
    pauseVideo: async () => {
      broadcast(
        room.connections,
        {
          type: "pauseVideo",
          data: {},
        },
        conn
      );
    },
    playVideo: async () => {
      broadcast(
        room.connections,
        {
          type: "playVideo",
          data: {
            subject: conn.uname,
          },
        },
        conn
      );
    },
    syncTimecodes: async () => {},
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
