import { describe, expect, it } from "vitest";

import { appLoginURL } from "./authTypes";
import { createRuntimeConfig } from "./runtimeConfig";

describe("createRuntimeConfig", () => {
  it("環境変数から実行時設定を作る", () => {
    expect(
      createRuntimeConfig({
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
      }),
    ).toEqual({
      apiBaseURL: "https://api.example.com",
      waitingRoomEnabled: false,
      waitingRoomPublicURL: "http://localhost:3100",
    });
  });

  it("待合室の公開URLを環境変数から設定する", () => {
    expect(
      createRuntimeConfig({
        WAITING_ROOM_PUBLIC_URL: "https://waiting.example.com",
      }).waitingRoomPublicURL,
    ).toBe("https://waiting.example.com");
  });

  it("同一 origin の API を表す空文字を保持する", () => {
    expect(
      createRuntimeConfig({ NEXT_PUBLIC_API_BASE_URL: "" }).apiBaseURL,
    ).toBe("");
  });

  it("環境変数がない場合はローカル開発用の既定値を使う", () => {
    expect(createRuntimeConfig({})).toEqual({
      apiBaseURL: "http://localhost:8080",
      waitingRoomEnabled: false,
      waitingRoomPublicURL: "http://localhost:3100",
    });
  });

  it.each([
    ["true", true],
    ["false", false],
    ["invalid", false],
  ])("待合室の有効化を明示指定する %s", (value, expected) => {
    expect(
      createRuntimeConfig({ WAITING_ROOM_ENABLED: value as string })
        .waitingRoomEnabled,
    ).toBe(expected);
  });
});

describe("appLoginURL", () => {
  it("アプリAPIのOIDCログインcallback開始URLを作る", () => {
    expect(appLoginURL({ apiBaseURL: "https://app.example.com" })).toBe(
      "https://app.example.com/auth/login",
    );
  });
});
