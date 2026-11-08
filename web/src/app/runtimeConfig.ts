export type RuntimeConfig = {
  apiBaseURL: string;
  waitingRoomEnabled: boolean;
  waitingRoomPublicURL: string;
};

type RuntimeConfigEnvironment = Readonly<Record<string, string | undefined>>;

export function createRuntimeConfig(
  environment: RuntimeConfigEnvironment,
): RuntimeConfig {
  return {
    apiBaseURL: environment.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
    waitingRoomEnabled: environment.WAITING_ROOM_ENABLED === "true",
    waitingRoomPublicURL:
      environment.WAITING_ROOM_PUBLIC_URL ?? "http://localhost:3100",
  };
}
