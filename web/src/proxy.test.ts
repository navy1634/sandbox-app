import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { proxy } from "./proxy";

describe("proxy", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubEnv("WAITING_ROOM_ENABLED", "true");
    vi.stubEnv("WAITING_ROOM_PUBLIC_URL", "https://waiting.example.com");
    vi.stubEnv("WAITING_ROOM_INTERNAL_URL", "http://waiting.internal:3100");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each([undefined, "false", "invalid"])(
    "無効時は待合室へ問い合わせずアプリを表示する %s",
    async (enabled) => {
      vi.stubEnv("WAITING_ROOM_ENABLED", enabled);
      const response = await proxy(
        new NextRequest("https://app.example.com/dashboard"),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("有効な入場Cookieがあればアプリを表示する", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
    const request = new NextRequest("https://app.example.com/dashboard", {
      headers: { cookie: "vwr_session=admitted" },
    });

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://waiting.internal:3100/protected",
      expect.objectContaining({
        cache: "no-store",
        headers: { cookie: "vwr_session=admitted" },
      }),
    );
  });

  it("入場Cookieがなければ元のURLを付けて待合室へ転送する", async () => {
    const request = new NextRequest(
      "https://app.example.com/dashboard?tab=profile",
    );

    const response = await proxy(request);

    const redirectURL = new URL(response.headers.get("location") ?? "");
    expect(response.status).toBe(307);
    expect(redirectURL.origin).toBe("https://waiting.example.com");
    expect(redirectURL.searchParams.get("return_to")).toBe(request.url);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("入場Cookieが拒否されたら待合室へ戻す", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
    const request = new NextRequest("https://app.example.com/");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(
      new URL(response.headers.get("location") ?? "").searchParams.get(
        "return_to",
      ),
    ).toBe(request.url);
  });

  it("待合室の応答が不明な場合はアプリを表示しない", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));
    const request = new NextRequest("https://app.example.com/", {
      headers: { cookie: "vwr_session=admitted" },
    });

    const response = await proxy(request);

    expect(response.status).toBe(503);
  });

  it("Ingress配下では公開ホストとプロトコルを復帰先に使う", async () => {
    const request = new NextRequest(
      "http://localhost:3000/dashboard?tab=profile",
      {
        headers: {
          "x-forwarded-host": "app.example.com",
          "x-forwarded-proto": "https",
        },
      },
    );
    const response = await proxy(request);
    expect(
      new URL(response.headers.get("location")!).searchParams.get("return_to"),
    ).toBe("https://app.example.com/dashboard?tab=profile");
  });
});
