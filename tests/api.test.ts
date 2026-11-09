import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../index";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("XENO backend API", () => {
  it("reports service health without exposing secrets", async () => {
    vi.stubEnv("XENO_API_TOKEN", "test-token");
    vi.stubEnv("AI_API_URL", "");
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_MODEL", "");

    const response = await app.request("/health");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.service).toBe("xeno-backend");
    expect(body.status).toBe("ok");
    expect(body.aiConfigured).toBe(false);
    expect(body.authConfigured).toBe(true);
    expect(JSON.stringify(body)).not.toContain("test-token");
  });

  it("rejects chat requests without a bearer token", async () => {
    vi.stubEnv("XENO_API_TOKEN", "test-token");

    const response = await app.request("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello XENO" }),
    });

    expect(response.status).toBe(401);
  });

  it("rejects empty messages", async () => {
    vi.stubEnv("XENO_API_TOKEN", "test-token");

    const response = await app.request("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ message: "   " }),
    });

    expect(response.status).toBe(400);
  });

  it("rejects messages longer than 4,000 characters", async () => {
    vi.stubEnv("XENO_API_TOKEN", "test-token");

    const response = await app.request("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ message: "x".repeat(4001) }),
    });

    expect(response.status).toBe(400);
  });

  it("returns unavailable when the AI provider is not configured", async () => {
    vi.stubEnv("XENO_API_TOKEN", "test-token");
    vi.stubEnv("AI_API_URL", "");
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_MODEL", "");

    const response = await app.request("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ message: "Hello XENO" }),
    });

    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error.code).toBe("AI_NOT_CONFIGURED");
  });

  it("returns provider responses using the output contract", async () => {
    vi.stubEnv("XENO_API_TOKEN", "test-token");
    vi.stubEnv("AI_API_URL", "https://provider.example/v1/chat/completions");
    vi.stubEnv("AI_API_KEY", "provider-test-key");
    vi.stubEnv("AI_MODEL", "test-model");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Hello from XENO." } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const response = await app.request("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ message: "Hello XENO" }),
    });

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.output).toBe("Hello from XENO.");
    expect(body.model).toBe("test-model");
  });
});
