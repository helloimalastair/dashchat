import type { Room } from ".";

export const sendJson = (connection: Connection, message: any) => {
  connection.ws.send(JSON.stringify(message));
};

// Closes down all connections
async function closeAll(room: Room, message = "Room deleted") {
  room.connections.forEach((c) => c.ws.close(1001, message));
  room.connections = [];
  room.owner = undefined;
}

// Broadcast Message to All Connections
async function broadcast(
  connections: Connection[],
  message: any,
  sender: Connection
) {
  for (const conn of connections) {
    if (conn.id !== sender.id) sendJson(conn, message);
  }
}

async function broadcastAll(room: Room, message: any) {
  for (const conn of room.connections) {
    sendJson(conn, message);
  }
}

export { broadcast, broadcastAll, closeAll };
