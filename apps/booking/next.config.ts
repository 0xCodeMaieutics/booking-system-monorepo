import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
// Local development shares one .env at the repo root; deployments set real env vars.
if (existsSync(`${repoRoot}.env`)) process.loadEnvFile(`${repoRoot}.env`);

const config: NextConfig = {
  transpilePackages: ["@tsami/api", "@tsami/booking", "@tsami/db", "@tsami/ui"],
  turbopack: { root: repoRoot },
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: ["192.168.0.211"],
  }),
};

export default config;
