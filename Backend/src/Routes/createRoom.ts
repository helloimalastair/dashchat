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
}

const createRoom: Handler<string, Environment> = async (c) => {
  if (c.req.headers.get("content-type") !== "application/json")
    return generateErrorResponse('Content-Type must be "application/json"');
  let body: creationBody;
  try {
    body = await c.req.json();
  } catch (e) {
    return generateErrorResponse("Body must be valid JSON");
  }
  const uname = c.req.cookie("uname");
  // Username Verification
  if (!uname) return usernameDoesNotExist();
  if (!NameRegex.test(uname))
    return generateErrorResponse("Username did not pass regex");
  // Room Name Verification
  if (!body.roomName) return generateErrorResponse("No room name provided");
  if (!NameRegex.test(body.roomName))
    return generateErrorResponse("Room name did not pass regex");
  console.log("Done validating input!");
  // User ID
  const owner = c.req.cookie("userId") || nanoid(),
    external = generatePhonetic(),
    isGDPR = c.req.cf?.continent === "EU",
    doOpts = isGDPR ? { jurisdiction: "EU" } : undefined,
    doId = c.env.ROOMS.newUniqueId(doOpts);
  console.log("Putting KV...");
  await c.env.KV.put(
    `${c.env.KVPrefix}-${external}`,
    JSON.stringify({
      status: "open",
      owner,
      doId: doId.toString(),
    })
  );
  console.log("Calling DO!");
  await c.env.ROOMS.get(doId).fetch(
    new Request("https://internal.dashchat.app/startup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        external,
        isGDPR,
        owner,
        name: body.roomName,
        videoLength: body.videoLength,
      } as StartupData),
    })
  );
  console.log("Called DO.");
  c.cookie("userId", owner, {
    httpOnly: true,
    maxAge: 31622400,
    secure: true,
    sameSite: "None",
    path: "/",
    domain: "dashchat.app",
  });

  return c.json({
    external,
    isGDPR,
    uploadLink: generateUploadLink(owner, c.env),
  });
};

export { createRoom };
