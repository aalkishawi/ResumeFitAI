/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep native/server-only parsing & document libraries out of the client bundle.
  // (Next 15+ renamed this from experimental.serverComponentsExternalPackages.)
  serverExternalPackages: ["pdf-parse", "mammoth", "docx", "pdf-lib"],
};

module.exports = nextConfig;
