import { nanoid } from "nanoid";
import { generateUploadLink } from "stream";
import { generateErrorResponse ,generatePhonetic, NameRegex, usernameDoesNotExist } from "utils";
import type { Handler } from "hono";

interface creationBody {
  roomName: string;
  password: string;
  videoLength: number;
}

const createRoom: Handler<string, Environment> = async c => {
  if(c.req.headers.get("content-type") !== "application/json") return generateErrorResponse("Content-Type must be \"application/json\"");
  let body: creationBody;
  try {
    body = await c.req.json();
  } catch(e) {
    return generateErrorResponse("Body must be valid JSON");
  }
  const uname = c.req.cookie("uname");
  // Username Verification
  if(!uname) return usernameDoesNotExist();
  if(!NameRegex.test(uname)) return generateErrorResponse("Username did not pass regex");
  // Room Name Verification
  if(!body.roomName) return generateErrorResponse("No room name provided");
  if(!NameRegex.test(body.roomName)) return generateErrorResponse("Room name did not pass regex");
  // User ID
  const owner = c.req.cookie("userId") || nanoid(),
    external = generatePhonetic(),
    isGDPR = c.req.cf?.continent === "EU",
    doOpts = isGDPR ? { jurisdiction: "EU" } : undefined,
    doId = c.env.ROOMS.newUniqueId(doOpts);
  await c.env.KV.put(`${c.env.KVPrefix}-${external}`, JSON.stringify({
    status: "open",
    owner,
    doId: doId.toString()
  }));
  await c.env.ROOMS.get(doId).fetch(new Request(c.env.InternalURL + "/startup", {body: JSON.stringify({
    external,
    isGDPR,
    owner,
    name: body.roomName,
    videoLength: body.videoLength
  } as StartupData)}));
  c.cookie("userId", owner, {
    httpOnly: true,
    maxAge: 31622400,
    sameSite: "Strict",
    secure: true
  });
  
  return c.json({
    external,
    isGDPR,
    uploadLink: generateUploadLink(owner, c.env)
  });
};

export { createRoom };