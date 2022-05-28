export default class Analytics {
  private readonly blockConcurrencyWhile: DurableObjectState["blockConcurrencyWhile"];
  private readonly storage: DurableObjectState["storage"];
  private readonly prefix: string;
  private readonly kv: KVNamespace;
  private data: AnalyticsData | undefined;

  constructor({blockConcurrencyWhile, storage}: DurableObjectState, {KVPrefix, KV}: Environment) {
    this.blockConcurrencyWhile = blockConcurrencyWhile;
    this.storage = storage;
    this.prefix = KVPrefix;
    this.kv = KV;
    this.blockConcurrencyWhile(async () => {
      const data = await this.storage.get<AnalyticsData>("data");
      this.data = data || {};
      await this.storage.setAlarm(Date.now() + 60000);
    });
  }

  public alarm() {
    this.blockConcurrencyWhile(async () => {
      if(!this.data) this.data = await this.storage.get<AnalyticsData>("data") || {};
      let rooms: number, occupants: number;
      rooms = occupants = 0;
      const countries = Object.values(this.data).reduce((a, b) => {
        Object.entries(b).forEach(c => {
          a[c[0]] = (a[c[0]] || 0) + c[1];
          occupants++;
      });
        rooms++;
        return a;
      }, {}),
        ret = {
          countries,
          rooms,
          occupants,
          timestamp: Date.now() 
        };
      this.data = {};
      await Promise.all([this.storage.delete("data"), this.kv.put(`${this.prefix}-analytics`, JSON.stringify({ret}))]);
      await this.storage.setAlarm(Date.now() + 60000);
    });
  }

  public async fetch(req: Request): Promise<Response> {
    if(!this.data) this.data = await this.storage.get<AnalyticsData>("data") || {};
    const {room, data} = await req.json() as AnalyticsDeliverable;
    this.data[room] = data;
    this.storage.put("data", this.data);
    return new Response(null, {status: 204});
  }
}