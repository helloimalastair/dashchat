import { generateErrorResponse, NameRegex } from "utils";
import type { Handler } from "hono";

const identifyUser: Handler<string, Environment> = async c => {
  const uname = await c.req.text();
  if(!NameRegex.test(uname)) return generateErrorResponse("Username did not pass regex");
  c.cookie("uname", uname, {
    maxAge: 31622400,
    sameSite: "Strict",
    secure: true
  });
  return c.text("OK");
};

export { identifyUser };