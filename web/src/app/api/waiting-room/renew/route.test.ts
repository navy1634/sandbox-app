import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST } from "./route";

describe("POST /api/waiting-room/renew", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("WAITING_ROOM_ENABLED", "true");
    vi.stubEnv("WAITING_ROOM_PUBLIC_URL", "https://waiting.example.com/base");
    vi.stubEnv("WAITING_ROOM_INTERNAL_URL", "http://waiting.internal:3100");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("無効時は入場枠を更新しない", async () => {
    vi.stubEnv("WAITING_ROOM_ENABLED", "false");
    const response = await POST(
      new NextRequest("https://app.example.com/api/waiting-room/renew", {
        method: "POST",
      }),
    );
    expect(response.status).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("入場Cookieがない場合は更新を拒否する", async () => {
    const response = await POST(
      new NextRequest("https://app.example.com/api/waiting-room/renew", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("待合室へ入場枠更新を中継する", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const response = await POST(
      new NextRequest("https://app.example.com/api/waiting-room/renew", {
        method: "POST",
        headers: { cookie: "vwr_session=admitted" },
      }),
    );

    expect(response.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://waiting.internal:3100/queue/renew",
      expect.objectContaining({
        method: "POST",
        headers: {
          cookie: "vwr_session=admitted",
          origin: "https://waiting.example.com",
        },
      }),
    );
  });

  it("Ingress配下でも公開Originからの更新を許可する", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const response = await POST(
      new NextRequest("http://localhost:3000/api/waiting-room/renew", {
        method: "POST",
        headers: {
          origin: "https://app.example.com",
          "x-forwarded-host": "app.example.com",
          "x-forwarded-proto": "https",
          cookie: "vwr_session=admitted",
        },
      }),
    );
    expect(response.status).toBe(204);
  });

  it("公開Originと異なる更新を拒否する", async () => {
    const response = await POST(
      new NextRequest("http://localhost:3000/api/waiting-room/renew", {
        method: "POST",
        headers: {
          origin: "https://attacker.example.com",
          "x-forwarded-host": "app.example.com",
          "x-forwarded-proto": "https",
          cookie: "vwr_session=admitted",
        },
      }),
    );
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
