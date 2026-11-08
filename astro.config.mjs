import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

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
  output: "server",
  adapter: vercel(),
  ...(site ? { site } : {}),
});
