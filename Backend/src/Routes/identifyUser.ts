import { generateErrorResponse, NameRegex } from "utils";
import type { Handler } from "hono";

const identifyUser: Handler<string, Environment> = async (c) => {
  // Parse input JSON.
  let uname: string = "";
  try {
    uname = ((await c.req.json()) as any).uname;
  } catch (e) {
    return generateErrorResponse("Invalid JSON");
  }

  // Parse input username.
  if (!uname || !NameRegex.test(uname))
    return generateErrorResponse("Invalid username.");

  // Set a username cookie.
  c.cookie("uname", uname, {
    maxAge: 31622400,
    sameSite: "None",
    secure: true,
    httpOnly: false,
    path: "/",
    domain: "dashchat.app",
  });

  return c.json({ success: true });
};

export { identifyUser };
