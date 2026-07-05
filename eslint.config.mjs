// ESLint 9 flat config for Next.js 16.
// eslint-config-next ships native flat-config arrays for its rule sets.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "out/**"] },
  ...nextCoreWebVitals,
  ...nextTypeScript,
];

export default config;
