import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { generateReply, isAIConfigured } from "../src/ai/provider";

const app = new Hono();
const allowedOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  "*",
  cors({
    origin: allowedOrigin,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  "*",
  bodyLimit({
    maxSize: 16 * 1024,
    onError: (c) =>
      c.json(
        {
          error: {
            code: "REQUEST_TOO_LARGE",
            message: "The request body must not exceed 16 KB.",
          },
        },
        413,
      ),
  }),
);

app.get("/health", (c) => {
  return c.json({
    service: "xeno-backend",
    status: "ok",
    aiConfigured: isAIConfigured(),
    authConfigured: Boolean(process.env.XENO_API_TOKEN),
    timestamp: new Date().toISOString(),
  });
});

app.post("/chat", async (c) => {
  const expectedToken = process.env.XENO_API_TOKEN;

  if (!expectedToken) {
    return c.json(
      {
        error: {
          code: "AUTH_NOT_CONFIGURED",
          message: "Chat access has not been configured on this deployment.",
        },
      },
      503,
    );
  }

  const authorization = c.req.header("Authorization") || "";
  const suppliedToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!suppliedToken || suppliedToken !== expectedToken) {
    return c.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "A valid bearer token is required.",
        },
      },
      401,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "The request body must be valid JSON.",
        },
      },
      400,
    );
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return c.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "The request body must be a JSON object.",
        },
      },
      400,
    );
  }

  const message = (body as { message?: unknown }).message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return c.json(
      {
        error: {
          code: "MESSAGE_REQUIRED",
          message: "Provide a non-empty message.",
        },
      },
      400,
    );
  }

  if (message.length > 4000) {
    return c.json(
      {
        error: {
          code: "MESSAGE_TOO_LONG",
          message: "Messages must not exceed 4,000 characters.",
        },
      },
      400,
    );
  }

  if (!isAIConfigured()) {
    return c.json(
      {
        error: {
          code: "AI_NOT_CONFIGURED",
          message: "The AI provider has not been configured yet.",
        },
      },
      503,
    );
  }

  try {
    const output = await generateReply(message.trim());
    return c.json({ output, model: process.env.AI_MODEL });
  } catch (error) {
    // Do not log request content, authorization headers, or provider secrets.
    console.error(
      "XENO provider request failed:",
      error instanceof Error ? error.message : "Unknown provider error",
    );

    return c.json(
      {
        error: {
          code: "AI_PROVIDER_ERROR",
          message: "XENO could not obtain a response from its AI provider.",
        },
      },
      502,
    );
  }
});

app.notFound((c) =>
  c.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "The requested API route does not exist.",
      },
    },
    404,
  ),
);

app.onError((error, c) => {
  console.error("XENO backend error:", error.message);
  return c.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
    },
    500,
  );
});

export default app;
