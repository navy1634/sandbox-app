"use client";

import { useEffect } from "react";

import { useRuntimeConfig } from "./runtimeConfigContext";

const renewalIntervalMs = 30_000;

export function WaitingRoomHeartbeat() {
  const { waitingRoomEnabled, waitingRoomPublicURL } = useRuntimeConfig();

  useEffect(() => {
    if (!waitingRoomEnabled) return;
    let stopped = false;
    const controller = new AbortController();

    function returnToWaitingRoom() {
      if (stopped) return;
      const waitingRoomURL = new URL(waitingRoomPublicURL);
      waitingRoomURL.searchParams.set("return_to", window.location.href);
      window.location.replace(waitingRoomURL.toString());
    }

    async function renew() {
      try {
        const response = await fetch("/api/waiting-room/renew", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) returnToWaitingRoom();
      } catch {
        returnToWaitingRoom();
      }
    }

    const interval = window.setInterval(() => void renew(), renewalIntervalMs);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      controller.abort();
    };
  }, [waitingRoomEnabled, waitingRoomPublicURL]);

  return null;
}
