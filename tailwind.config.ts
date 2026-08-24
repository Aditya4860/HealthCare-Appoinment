import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // shadcn base tokens (kept for component compatibility)
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },

        // ── MediBook Design System Palette (Overrides/Additions) ────────────
        brand: {
          DEFAULT: "#0F4C81", // deep medical blue — primary actions, nav bg
          light: "#E8F1FA",   // blue tint — active states, selected slots
        },
        "mb-accent": "#00897B", // teal — confirmed/success, urgency Low
        warn:        "#F59E0B", // amber — urgency Medium, HOLD status
        danger:      "#DC2626", // red — urgency High, cancelled, errors
        surface:     "#F8FAFC", // off-white page background
        "mb-card":   "#FFFFFF", // card backgrounds
        "mb-border": "#E2E8F0", // default borders
        "mb-muted":  "#64748B", // secondary text
      },
      fontFamily: {
        sans:    ["Inter", "sans-serif"],
        display: ["Sora", "sans-serif"],
      },
      maxWidth: {
        content: "1200px",
      },
      borderRadius: {
        xl:  "0.75rem",
        "2xl": "1rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
