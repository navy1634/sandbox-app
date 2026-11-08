import { NextRequest, NextResponse } from "next/server";
import { publicRequestURL } from "./app/requestURL";
import { createRuntimeConfig } from "./app/runtimeConfig";

export async function proxy(request: NextRequest) {
  if (!createRuntimeConfig(process.env).waitingRoomEnabled) {
    return NextResponse.next();
  }
  try {
    const waitingRoomURL = new URL(
      process.env.WAITING_ROOM_PUBLIC_URL ?? "http://localhost:3100",
    );
    waitingRoomURL.searchParams.set(
      "return_to",
      publicRequestURL(request).href,
    );
    const session = request.cookies.get("vwr_session");

    if (!session?.value) {
      return NextResponse.redirect(waitingRoomURL);
    }

    const response = await fetch(
      new URL(
        "/protected",
        process.env.WAITING_ROOM_INTERNAL_URL ?? "http://localhost:3100",
      ).toString(),
      {
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: { cookie: `vwr_session=${encodeURIComponent(session.value)}` },
      },
    );

    if (response.status === 200) {
      return NextResponse.next();
    }
    if (response.status === 401 || response.status === 403) {
      return NextResponse.redirect(waitingRoomURL);
    }
  } catch {
    // 待合室の障害時も入場確認を省略しません。
  }

  return new NextResponse(null, {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}

export const config = {
  matcher: ["/((?!api(?:/|$)|_next(?:/|$)|favicon\\.ico$).*)"],
};
