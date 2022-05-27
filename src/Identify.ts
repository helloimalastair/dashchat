import UsernameRegex from "./NameRegex";
import type { Handler } from "hono";

const Identify: Handler<string, Environment> = async c => {
  const uname = await c.req.text();
  if(!UsernameRegex.test(uname)) {
    c.status(400);
    return c.text("Username does not pass regex");
  }
  c.cookie("uname", uname);
  return c.text("OK");
};

export default Identify;