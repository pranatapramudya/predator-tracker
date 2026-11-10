import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        floq: {
          dark: "#061a1d", // Deep Pine Forest Background
          card: "#0b272a", // Soft Dark Forest Card
          surface: "#0f3236", // Elevated Sub-card / Input
          border: "rgba(163, 247, 132, 0.16)",
          mint: "#a3f784", // Floq Signature Soft Mint
          mintHover: "#b6f99c",
          mintText: "#052020",
          sage: "#9bb8b5", // Soft eye-friendly label text
          text: "#f4fbf8", // Crisp Warm White
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
          "'Apple Color Emoji'",
          "'Segoe UI Emoji'",
        ],
        mono: [
          "'JetBrains Mono'",
          "ui-monospace",
          "SFMono-Regular",
          "'SF Mono'",
          "Menlo",
          "Consolas",
          "'Liberation Mono'",
          "monospace",
        ],
      },
    },
  },
};
export default config;
