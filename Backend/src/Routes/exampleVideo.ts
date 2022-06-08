import type { Handler } from "hono";

const exampleVideo: Handler<string, Environment> = async (c) => {
  const object = (await c.env.R2.get("example-video.mp4")) as R2ObjectBody;
  console.log(object.size);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Disposition", "attachment; filename=example-video.mp4");
  return new Response(object.body, {
    headers,
    status: 200,
  });
};

export { exampleVideo };
