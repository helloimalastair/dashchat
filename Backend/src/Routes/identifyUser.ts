import { generateErrorResponse, NameRegex } from "utils";
import type { Handler } from "hono";

const identifyUser: Handler<string, Environment> = async c => {
  let uname: string = "";
  try {
    uname = (await c.req.json() as any).uname;
  } catch(e) {
    return generateErrorResponse("Invalid JSON");
  }
  if(!uname) return generateErrorResponse("No username provided");
  if(!NameRegex.test(uname)) return generateErrorResponse("Username did not pass regex");
  c.cookie("uname", uname, {
    maxAge: 31622400,
    sameSite: "Strict",
    secure: true,
    path: "/"
  });
  return c.text("OK");
};

export { identifyUser };