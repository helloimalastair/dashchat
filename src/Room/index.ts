import { generateErrorResponse, usernameDoesNotExist } from "utils";
import analyticsUpdate from "./AnalyticsUpdate";
import handleMessage from "./MessageHandler";
import { closeAll } from "./utils";

export class Room {
  ids: IDs;
  storage: DurableObjectStorage;
  blockConcurrencyWhile: DurableObjectState["blockConcurrencyWhile"];
  env: Environment;
  owner: Connection | undefined;
  connections: Connection[] = [];
  maxOccupants: number;
  log: any[] = [];
  status: RoomStatus = "open";
  isGDPR = true;
  videoLength: number | undefined;
  videoReady = false;

  constructor(state: DurableObjectState, env: Environment) {
    this.ids = {
      do: state.id.toString()
    };
    this.storage = state.storage;
    this.blockConcurrencyWhile = state.blockConcurrencyWhile;
    this.env = env;
    this.maxOccupants = Number(env.MaxOccupants);
    this.blockConcurrencyWhile(async () => {
      const status = await this.storage.get<RoomStatus>("status");
      if(status) this.status = status;
    });
  }

  // Private method to connect a user to the room.
  private async connect(req: Request) : Promise<Response> {
    if(this.status !== "open") return generateErrorResponse(`Room is ${this.status}`, 503);
    const uname = req.headers.get("uname"),
      isOwner = Boolean(req.headers.get("isOwner"));
    if(!uname) return usernameDoesNotExist();
    if(isOwner && this.connections.find(e => e.isOwner)) return generateErrorResponse("Owner already connected");
    if(this.connections.find(e => e.uname === uname)) return generateErrorResponse("Username already connected");
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();
    const connection: Connection = {
      uname,
      isOwner,
      location: req.cf?.country,
      ws: server,
    };
    server.addEventListener("message", async event => handleMessage(this, connection, event));
    if(connection.isOwner) this.owner = connection;
    this.connections.push(connection);
    if(this.connections.length >= this.maxOccupants) {
      this.status = "at capacity";
      if(!this.ids.external) return generateErrorResponse("Room has not been initiated", 500);
      await this.env.KV.put(`${this.env.KVPrefix}-${this.ids.external}`, JSON.stringify({
        status: this.status,
        ownerId: this.ids.external,
        doId: this.ids.do
      }));
    }
    return new Response("Upgrade in progress", {status: 101, webSocket: client});
  }

  async fetch(req: Request) : Promise<Response> {
    const path = new URL(req.url).pathname;
    switch(path) {
      case "/startup":
        const data = await req.json() as StartupData;
        this.ids.external = data.external;
        this.ids.owner = data.owner;
        this.ids.name = data.name;
        this.isGDPR = data.isGDPR;
        this.videoLength = data.videoLength;
        if(data.maxOccupants) this.maxOccupants = data.maxOccupants;
        await this.storage.setAlarm(Date.now() + 60000);
        return new Response("OK");
      case "/ready":
        this.videoReady = true;
        return new Response("OK");
      case "/delete":
        await closeAll(this);
        await this.storage.deleteAll();
        return new Response("Room deleted", {status: 200});
      case "/connect":
        if(!this.videoReady) return generateErrorResponse("Video has not finished processing");
        return this.connect(req);
    }
    return new Response("Invalid Internal URL", {status: 404});
  }

  async alarm() {
    if(this.status === "ended") {
      await this.env.KV.put(`${this.env.KVPrefix}-${this.ids.external}-log`, JSON.stringify(this.log), {metadata: {owner: this.ids.owner}});
      return await this.storage.deleteAll();
    }
    await this.storage.put("log", this.log);
    analyticsUpdate(this);
    await this.storage.setAlarm(Date.now() + 60000);
  }
}