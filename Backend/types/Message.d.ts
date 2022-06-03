declare type Commands = "delete" | "end" | "lock" | "unlock" | "start" | "stop" | "skipTo";

declare interface RoomCommunication {
  message?: string;
  command?: Commands;
  timestamp?: number;
}