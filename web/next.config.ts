import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@wasp/shared"],
  // Allows the dev server's HMR websocket to be reached from a phone on the
  // same LAN (e.g. http://192.168.1.247:3000) instead of only localhost.
  allowedDevOrigins: ["192.168.1.247"],
};

export default withNextIntl(nextConfig);
