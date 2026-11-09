import { describe, expect, it } from "vitest";
import app from "../index";

describe("XENO minimal runtime diagnostic", () => {
  it("returns a healthy service response", async () => {
    const response = await app.request("/health");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.service).toBe("xeno-backend");
    expect(body.status).toBe("ok");
    expect(body.test).toBe("minimal-runtime");
  });
});
