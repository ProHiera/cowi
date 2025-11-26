import type { ExpoConfig } from "expo-config";

const DEFAULT_BASE_URL = process.env.MOBILE_BASE_URL ?? "https://cowi.vercel.app";
const STAGING_BASE_URL = process.env.MOBILE_STAGE_URL ?? "https://cowi-staging.vercel.app";

const config: ExpoConfig = {
  name: "Cowi Mobile",
  slug: "cowi-mobile",
  scheme: "cowi",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  experiments: {
    typedRoutes: true,
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.cowi.mobile",
  },
  android: {
    package: "com.cowi.mobile",
  },
  web: {
    bundler: "metro",
    output: "static",
  },
  extra: {
    defaultBaseUrl: DEFAULT_BASE_URL,
    stagingBaseUrl: STAGING_BASE_URL,
    eas: {
      projectId: "00000000-0000-0000-0000-000000000000",
    },
  },
};

export default config;
