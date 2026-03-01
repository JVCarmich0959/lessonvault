import * as nextPWA from "next-pwa";

const withPWA = nextPWA?.default ?? nextPWA?.withPWA ?? nextPWA;

const nextConfig = { reactStrictMode: true };

const isDev = process.env.NODE_ENV === "development";
const pwaConfig = { dest: "public", disable: isDev };

let config = nextConfig;
if (!isDev && typeof withPWA === "function") {
  const result = withPWA(pwaConfig);
  // Some next-pwa builds return a function, others return a config object.
  if (typeof result === "function") {
    config = result(nextConfig);
  } else {
    const { dest: _dest, disable: _disable, ...resolved } = result ?? {};
    config = { ...nextConfig, ...resolved };
  }
}

export default config;
