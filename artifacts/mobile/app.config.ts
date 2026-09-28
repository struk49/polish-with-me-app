import type { ConfigContext, ExpoConfig } from "expo/config";

const DEVELOPMENT_VARIANT = "development";
const PRODUCTION_ONLY_BLOCKED_PERMISSIONS = [
  "android.permission.RECORD_AUDIO",
  "android.permission.SYSTEM_ALERT_WINDOW",
];

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDevelopment = process.env.APP_VARIANT === DEVELOPMENT_VARIANT;
  const plugins = config.plugins ?? [];
  const hasSentryPlugin = plugins.some((plugin) =>
    Array.isArray(plugin) ? plugin[0] === "@sentry/react-native/expo" : plugin === "@sentry/react-native/expo",
  );

  return {
    ...config,
    name: isDevelopment ? "Polish with Me Dev" : "Polish with Me",
    slug: config.slug ?? "mobile",
    scheme: isDevelopment ? "mobile-dev" : "mobile",
    plugins: hasSentryPlugin ? plugins : [...plugins, "@sentry/react-native/expo"],
    android: {
      ...config.android,
      package: isDevelopment ? "com.polishwithme.app.dev" : "com.polishwithme.app",
      blockedPermissions: isDevelopment
        ? config.android?.blockedPermissions
        : Array.from(
            new Set([
              ...(config.android?.blockedPermissions ?? []),
              ...PRODUCTION_ONLY_BLOCKED_PERMISSIONS,
            ]),
          ),
    },
  };
};
