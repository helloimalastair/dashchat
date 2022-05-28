declare interface Environment {
  KV: KVNamespace;
  KVPrefix: string;
  ROOMS: DurableObjectNamespace;
  ANALYTICS: DurableObjectNamespace;
  InternalURL: string;
  MaxOccupants: string;
}