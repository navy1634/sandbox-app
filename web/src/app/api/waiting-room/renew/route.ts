import type { NextRequest } from "next/server";
import { publicRequestURL } from "../../../requestURL";
import { createRuntimeConfig } from "../../../runtimeConfig";

export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (!createRuntimeConfig(process.env).waitingRoomEnabled) {
    return new Response(null, { status: 204, headers });
  }
  const origin = request.headers.get("origin");
  if (origin && origin !== publicRequestURL(request).origin) {
    return new Response(null, { status: 403, headers });
  }

  const session = request.cookies.get("vwr_session");
  if (!session?.value) {
    return new Response(null, { status: 401, headers });
  }

  try {
    const response = await fetch(
      new URL(
        "/queue/renew",
        process.env.WAITING_ROOM_INTERNAL_URL ?? "http://localhost:3100",
      ).toString(),
      {
        method: "POST",
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: {
          cookie: `vwr_session=${encodeURIComponent(session.value)}`,
          origin: new URL(
            process.env.WAITING_ROOM_PUBLIC_URL ?? "http://localhost:3100",
          ).origin,
        },
      },
    );

    if (response.ok || response.status === 401 || response.status === 403) {
      return new Response(null, { status: response.status, headers });
    }
  } catch {
    // 通信失敗を更新成功として扱わず、クライアントを待合室へ戻します。
  }

  return new Response(null, { status: 503, headers });
}
