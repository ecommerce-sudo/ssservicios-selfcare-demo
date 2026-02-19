/** @type {import('next').NextConfig} */
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// next-pwa es CommonJS; con createRequire lo usamos en un config ESM
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: require("next-pwa/cache"),
});

const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
