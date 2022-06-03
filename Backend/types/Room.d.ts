declare type RoomStatus = "open" | "at capacity" | "locked" | "deleted" | "ended";

declare interface Connection {
  ws: WebSocket;
  uname: string;
  location: string | undefined;
  isOwner: boolean;
}

declare interface IDs {
  do: string;
  owner?: string;
  external?: string;
  name?: string;
}

declare interface StartupData {
  external: string;
  owner: string;
  name: string;
  isGDPR: boolean;
  videoLength: number;
  maxOccupants?: number;
}