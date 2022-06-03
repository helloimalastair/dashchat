import type { Room } from ".";

// Closes down all connections
async function closeAll(room: Room, message = "Room deleted") {
  room.connections.forEach(c => c.ws.close(1001, message));
  room.connections = [];
  room.owner = undefined;
}

// Broadcast Message to All Connections
async function broadcast(room: Room, message: any, sender: string) {
  room.connections.forEach(c => {
    if(c.uname !== sender) c.ws.send(message);
  });
}

async function updateStatus(room: Room, status: RoomStatus) {
  if(!room.ids.external) return false;
  room.status = status;
  await room.env.KV.put(`${room.env.KVPrefix}-${room.ids.external}`, JSON.stringify({
    status: room.status,
    ownerId: room.ids.external,
    doId: room.ids.do
  }));
  return true;
}

export { broadcast, closeAll, updateStatus };