// eslint.config.mjs - Flat config (Next.js 15 / ESLint 9)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked, // usa type-check quando possível
  nextPlugin.configs["core-web-vitals"],

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Mantém a regra, mas como WARNING - não bloqueia build
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  // Áreas onde o uso de any é mais comum durante o CRUD administrativo:
  {
    files: [
      "app/admin/**/*.{ts,tsx}",
      "app/api/**/*.{ts,tsx}",
      "components/**/New*Form.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
