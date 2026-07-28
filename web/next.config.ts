import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@wasp/shared"],
  allowedDevOrigins: ["192.168.1.247"],
};

export default withNextIntl(nextConfig);
