declare interface Environment {
  KV: KVNamespace;
  KVPrefix: string;
  ROOMS: DurableObjectNamespace;
  InternalURL: string;
  MaxOccupants: string;
}