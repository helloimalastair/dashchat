import type { Handler } from "hono";

const exampleVideo: Handler<string, Environment> = async (c) => {
  const object = await c.env.R2.get("/example-video.mp4");
  const blob = await object?.blob();
  return new Response(blob, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": "inline; filename=example-video.mp4",
    },
  });
};

export { exampleVideo };
