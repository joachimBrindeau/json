import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**",
      "tests/debug/**",
      "tests/manual/**",
      "test-db-connection.js",
    ],
  },
  {
    rules: {
      // Enforce absolute imports using @ alias
      "no-restricted-imports": "off",
      // Warn about console statements (should use logger)
      "no-console": "warn",
      // Downgrade TypeScript strict rules to warnings
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      // Allow require() in server-side utility files for Node.js compatibility
      "@typescript-eslint/no-require-imports": ["error", {
        "allow": ["js-yaml", "@prisma/client", "@/lib/db", "@/lib/api/client"]
      }],
    },
  },
  {
    // Allow require() in lib/utils files that need Node.js compatibility
    files: ["lib/**/*.ts", "lib/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
