import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({
    service: "xeno-backend",
    status: "ok",
    test: "minimal-runtime",
  });
});

export default app;
