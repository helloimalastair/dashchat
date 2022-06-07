declare interface Connection {
  id: string;
  ws: WebSocket;
  uname: string;
  isOwner: boolean;
}

declare interface IDs {
  do: string;
  owner?: string;
  external?: string;
  name?: string;
}

declare interface StartupData {
  streamId: string;
  owner: string;
  name: string;
}
