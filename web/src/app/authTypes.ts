import type { RuntimeConfig } from "./runtimeConfig";

export type MeResponse = {
  authenticated: boolean;
  appAccount?: {
    id: number;
    email?: string;
    createdAt: string;
    updatedAt: string;
  };
  user?: {
    sub: string;
    email?: string;
    emailVerified?: boolean;
  };
};

export function appLoginURL(runtimeConfig: Pick<RuntimeConfig, "apiBaseURL">) {
  return `${runtimeConfig.apiBaseURL}/auth/login`;
}
