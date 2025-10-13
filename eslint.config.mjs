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
    ],
  },
  {
    rules: {
      // Enforce absolute imports using @ alias
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*", "../../*", "../../../*"],
              message: "Use absolute imports with @/ prefix instead of relative imports.",
            },
          ],
        },
      ],
      // Warn about console statements (should use logger)
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"], // Allow console.warn and console.error temporarily
        },
      ],
    },
  },
];

export default eslintConfig;
