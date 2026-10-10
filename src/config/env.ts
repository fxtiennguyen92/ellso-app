const ENVS = {
  local: {
    API_URL:
      process.env.EXPO_PUBLIC_LOCAL_API_URL ?? "http://192.168.1.10:8000/v1",
  },
  production: {
    API_URL: "https://api.ellso.edu.vn/v1",
  },
} as const;

export type AppEnv = keyof typeof ENVS;

const APP_ENV = (process.env.EXPO_PUBLIC_APP_ENV ?? "local") as AppEnv;

export const ENV = { APP_ENV, ...ENVS[APP_ENV] };
