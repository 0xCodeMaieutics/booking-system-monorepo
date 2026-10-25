import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

const config: NextConfig = {
  transpilePackages: ["@tsami/ui"],
  turbopack: { root: repoRoot },
};

export default config;
