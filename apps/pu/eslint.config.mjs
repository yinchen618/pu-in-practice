import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends("next/core-web-vitals", "next/typescript"),
	{
		rules: {
			"@typescript-eslint/no-unused-vars": "warn",
			"react/no-unescaped-entities": "warn",
			"jsx-a11y/alt-text": "warn",
			"react-hooks/exhaustive-deps": "warn",
			"jsx-a11y/click-events-have-key-events": "warn",
			"jsx-a11y/no-static-element-interactions": "warn",
			"prefer-arrow-callback": "warn",
			"react/jsx-key": "warn",
			"react/jsx-no-undef": "error",
			"jsx-a11y/label-has-associated-control": "warn",
		},
	},
];

export default eslintConfig;
