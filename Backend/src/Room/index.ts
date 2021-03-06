import { generateErrorResponse } from "utils";
import handleMessage from "./MessageHandler";
import { closeAll, sendJson } from "./utils";
import handleDisconnect from "./ErrorHandler";

export class Room {
  env: Environment;
  state: DurableObjectState;
  owner: Connection | undefined;
  connections: Connection[] = [];

  messages: { sender: string; message: string; timestamp: number }[] = [];

  constructor(state: DurableObjectState, env: Environment) {
    this.state = state;
    this.env = env;
  }

  private async connect(req: Request): Promise<Response> {
    const username = req.headers.get("X-Username");
    const userId = req.headers.get("X-UserId");
    const isOwner = Boolean(req.headers.get("X-Owner"));

    if (!username || !userId) {
      console.log("Invalid username.");
      return generateErrorResponse("Invalid username");
    }

    // Verify that this is the only owner.
    if (isOwner && this.connections.find((e) => e.isOwner)) {
      console.log("Owner already connected!");
      return generateErrorResponse("Owner already connected");
    }
    if (this.connections.find((e) => e.uname === username)) {
      // Kick the existing user.
      const connection = this.connections.find((e) => e.uname === username);
      if (connection) {
        connection.ws.close(1000);
        this.connections = this.connections.filter((e) => e !== connection);
      }
    }

    // Accept the WebSocket connection.
    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    // Declare connection.
    const connection: Connection = {
      id: userId,
      uname: username,
      isOwner,
      ws: server,
    };

    // Attach handlers.
    server.addEventListener(
      "message",
      async (event) => await handleMessage(this, connection, event)
    );
    server.addEventListener("close", () => {
      this.connections = this.connections.filter((e) => e !== connection);
    });
    server.addEventListener("error", async () => {
      this.connections = this.connections.filter((e) => e !== connection);
    });

    // Add the connection to the list.
    this.connections.push(connection);
    if (this.connections.length >= Number(this.env.MaxOccupants || Infinity)) {
      await this.state.storage.put("status", "at_capacity");
    }

    // Upgrade the connection.
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async fetch(req: Request): Promise<Response> {
    const pathname = new URL(req.url).pathname;

    // Used this pattern rather than switch statements to avoid errors
    // when using the same variable names.
    const handler = {
      "/startup": async () => {
        // Parse input data.
        const data = (await req.json()) as StartupData;

        // Set storage keys.
        this.state.storage.put("status", "processing");
        this.state.storage.put("ownerId", data.owner);
        await this.state.storage.put("streamId", data.streamId);

        return new Response("OK");
      },
      "/set-status": async () => {
        // Parse input data.
        const status = (await req.json()) as {
          status: string;
        };

        // Set storage keys.
        await this.state.storage.put("status", status.status);

        return new Response("OK");
      },
      "/get-status": async () => {
        // Get status.
        const status = (await this.state.storage.get("status")) as string;
        const ownerId = (await this.state.storage.get("ownerId")) as string;
        const streamId = (await this.state.storage.get("streamId")) as string;
        const numberOfConnections = this.connections.length;

        return new Response(
          JSON.stringify({ status, ownerId, streamId, numberOfConnections })
        );
      },
      "/connect": async () => {
        console.log("Connect received, connecting...");
        // Get status.
        const status = (await this.state.storage.get("status")) as string;
        if (status !== "ready") {
          console.log("Room not ready!");
          return generateErrorResponse("Video has not finished processing");
        } else {
          return await this.connect(req);
        }
      },
    }[pathname];

    if (handler) {
      return await handler();
    } else {
      return new Response("Not Found", { status: 404 });
    }
  }
}
