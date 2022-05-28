import { broadcast, closeAll, updateStatus } from "./utils";
import type Room from ".";

const decoder = new TextDecoder(),
  errorGenerator = (m: string) => JSON.stringify({time: Date.now(), type: "error", message: m}),
  systemGenerator = (m: string) => JSON.stringify({time: Date.now(), type: "system", message: m});

export default async function handleMessage(room: Room, connection: Connection, event: MessageEvent): Promise<void> {
  let payload: RoomCommunication;
  try {
    if(typeof event.data === "string") payload = JSON.parse(event.data);
    else payload = JSON.parse(decoder.decode(event.data));
  } catch(e) {
    return connection.ws.send("Invalid/Unparseable JSON");
  }
  if(payload.message) {
    room.log.push({time: Date.now(), user: connection.uname, message: payload.message});
    return connection.ws.send(JSON.stringify({time: Date.now(), type: "message", message: payload.message}));
  }
  switch(payload.command) {
    case "delete":
      if(!connection.isOwner) return connection.ws.send(errorGenerator("Unauthorized. Must be owner to use commands."));
      await Promise.all([
        closeAll(room),
        room.storage.deleteAll(),
        room.env.KV.delete(`${room.env.KVPrefix}-${room.ids.external}`),
      ]);
      return;
    case "end":
      if(!connection.isOwner) return connection.ws.send(errorGenerator("Unauthorized. Must be owner to use commands."));
      await updateStatus(room, "ended");
      await closeAll(room, "Room ended.");
      room.log.push({time: Date.now(), user: connection.uname, command: "end"});
      await room.storage.setAlarm(Date.now() + 60000);
      return;
    case "lock":
      if(!connection.isOwner) return connection.ws.send(errorGenerator("Unauthorized. Must be owner to use commands."));
      if(room.status === "locked") return connection.ws.send(errorGenerator("Error: Room is already locked"));
      await updateStatus(room, "locked");
      room.log.push({time: Date.now(), user: connection.uname, command: "lock"});
      return connection.ws.send(systemGenerator("Room is now locked."));
    case "unlock":
      if(!connection.isOwner) return connection.ws.send(errorGenerator("Unauthorized. Must be owner to use commands."));
      if(room.status !== "locked") return connection.ws.send(errorGenerator("Error: Room is already unlocked"));
      if(room.connections.length < room.maxOccupants) await updateStatus(room, "open");
      else await updateStatus(room, "at capacity");
      room.log.push({time: Date.now(), user: connection.uname, command: "unlock"});
      return connection.ws.send(systemGenerator("Room is now unlocked."));
    case "start":
    case "stop":
    case "skipTo":
      if(!payload.timestamp) return connection.ws.send(errorGenerator("Error. Must have a timestamp."));
      const time = Date.now();
      room.log.push({time, user: connection.uname, command: payload.command, timestamp: payload.timestamp});
      broadcast(room, JSON.stringify({time, type: "control", command: payload.command, timestamp: payload.timestamp}), connection.uname);
  }
};