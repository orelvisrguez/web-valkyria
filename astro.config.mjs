import { defineConfig } from "astro/config";

const deploymentHost =
  process.env.SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  process.env.VERCEL_URL;
const site = deploymentHost
  ? new URL(
      deploymentHost.startsWith("http")
        ? deploymentHost
        : `https://${deploymentHost}`,
    ).origin
  : undefined;

export default defineConfig({
  ...(site ? { site } : {}),
});
