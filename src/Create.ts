import { nanoid } from "nanoid";
import NameRegex from "./NameRegex";
import type { Handler } from "hono";

const randInRange = (max: number) => Math.floor(crypto.getRandomValues(new Uint32Array(1))[0]/(0xffffffff + max)),
  randOf = (collection: string) => () => collection[randInRange(collection.length)],
  generatePhonetic = () => {
    const randVowel = randOf("aeiou"),
    randConsonant = randOf("bcdfghjklmnpqrstvwxyz");
    let id = "";
    for (let i = 0; i < 10; i++) id += (i % 2 == randInRange(1)) ? randConsonant() : randVowel();
    return id;
  };

const Create: Handler<string, Environment> = async c => {
  if(c.req.header("content-type") === "multipart/formdata") return new Response("Must be multipart/formdata", {status: 415});
  const uname = c.req.cookie("uname"),
    roomName = c.req.header("room-name");
  // Username Verification
  if(!uname) {
    c.status(400);
    return c.text("Must have a username");
  }
  if(!NameRegex.test(uname)) {
    c.status(400);
    return c.text("Username failed regex");
  }
  // Room Name Verification
  if(!roomName) {
    c.status(400);
    return c.text("Must have a room name");
  }
  if(!NameRegex.test(roomName)) {
    c.status(400);
    return c.text("Room name failed regex");
  }
  // User ID
  const owner = c.req.cookie("userId") || nanoid(),
    external = generatePhonetic(),
    doId = c.env.ROOMS.newUniqueId(),
    isGDPR = c.req.cf?.continent === "EU";
  await c.env.KV.put(external, JSON.stringify({
    status: "open",
    owner,
    doId: doId.toString()
  }));
  await c.env.ROOMS.get(doId).fetch(new Request(c.env.InternalURL + "/startup", {body: JSON.stringify({
    external,
    isGDPR,
    owner,
    name: roomName,
    videoLength: 1000000 // Hardcoded, needs to be removed and dynamic
  } as StartupData)}));
  return Response.redirect("/" + external);
};

export default Create;