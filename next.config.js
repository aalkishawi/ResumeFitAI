/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

// Content Security Policy. 'unsafe-inline' is required for the theme-init script
// and framework bootstrap (a nonce-based strict CSP would need middleware); dev
// additionally needs 'unsafe-eval' + ws: for HMR. Client code only talks to the
// same origin — Google OAuth and Stripe Checkout are top-level redirects, so
// they aren't restricted by connect-src.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  reactStrictMode: true,
  // Keep native/server-only parsing & document libraries out of the client bundle.
  // (Next 15+ renamed this from experimental.serverComponentsExternalPackages.)
  serverExternalPackages: ["pdf-parse", "mammoth", "docx", "pdf-lib"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
