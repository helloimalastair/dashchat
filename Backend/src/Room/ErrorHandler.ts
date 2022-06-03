import { broadcast } from "./utils";
import type { Room } from ".";

const handleDisconnect = (room: Room, connection: Connection) => broadcast(room, `User ${connection.uname} has disconnected.`, "[SYSTEM]");
export default handleDisconnect;