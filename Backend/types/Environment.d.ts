declare interface Environment {
  CFAccountID: string;
  CFAPIToken: string;
  KV: KVNamespace;
  KVPrefix: string;
  ROOMS: DurableObjectNamespace;
  ANALYTICS: DurableObjectNamespace;
  InternalURL: string;
  MaxOccupants: string;
  // Secret for Webhook Verification
  StreamWebhookSecret: string;
  // Signed URL requirements
  StreamSignatureID: string;
  StreamSignatureJWK: string;
}