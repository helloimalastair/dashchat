import { nanoid } from "nanoid";
import { generateUploadLink } from "stream";
import {
  generateErrorResponse,
  generatePhonetic,
  NameRegex,
  usernameDoesNotExist,
} from "utils";
import type { Handler } from "hono";

interface creationBody {
  roomName: string;
  password: string;
  videoLength: number;
  videoSize: number;
}

const createRoom: Handler<string, Environment> = async (c) => {
  // Parse body.
  let body: creationBody;
  try {
    body = await c.req.json();
  } catch (e) {
    return generateErrorResponse("Body must be valid JSON");
  }

  // Get username cookie.
  const uname = c.req.cookie("uname");

  // Verify username.
  if (!uname || !NameRegex.test(uname)) {
    return generateErrorResponse("Invalid username.");
  }

  // Verify room name.
  if (!body.roomName || !NameRegex.test(body.roomName)) {
    return generateErrorResponse("Invalid room name");
  }

  // Generate IDs.
  const owner = c.req.cookie("userId") || nanoid();
  const doId = c.env.ROOMS.newUniqueId({
    jurisdiction: c.req.cf?.continent === "EU" ? "EU" : undefined,
  });

  // Generate upload link.
  const uploadData = await generateUploadLink(owner, body.videoSize, c.env);

  // Do a KV put.
  await c.env.KV.put(
    `streamToRoom:${uploadData.id}`,
    JSON.stringify({
      doId: doId.toString(),
    })
  );

  // Create the room DO.
  const stub = c.env.ROOMS.get(doId);
  await stub.fetch(
    new Request("https://internal.dashchat.app/startup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        streamId: uploadData.id,
        owner,
        name: body.roomName,
      } as StartupData),
    })
  );

  // Add a user ID cookie.
  c.cookie("userId", owner, {
    httpOnly: true,
    maxAge: 31622400,
    secure: true,
    sameSite: "None",
    path: "/",
    domain: "dashchat.app",
  });

  return c.json({
    success: true,
    streamId: uploadData.id,
    doId: doId.toString(),
    uploadLink: uploadData.url,
  });
};

export { createRoom };
