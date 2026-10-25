import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";
const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
});
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["test/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];
export default config;
