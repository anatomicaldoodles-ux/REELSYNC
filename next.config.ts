import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf ships its own bundling-sensitive dependencies; run it as-is on the server.
  serverExternalPackages: ["@react-pdf/renderer"],
  // Make sure the bundled PDF fonts are shipped with serverless/standalone builds.
  outputFileTracingIncludes: {
    "/api/reports/[id]/pdf": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
