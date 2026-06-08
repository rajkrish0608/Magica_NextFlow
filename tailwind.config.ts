import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Inter Fallback",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: ["Lora", "Lora Fallback", "serif"],
        brand: ["Google Sans Flex", "Inter", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        brand: {
          red: "#E42024",
          indigo: "#6366f1",
          "indigo-light": "#818cf8",
        },
        galaxy: {
          surface: {
            main: "#ffffff",
            primary: "#efeff0",
            secondary: "#e0e0e2",
            tertiary: "#f6f6f6",
            disabled: "#e3e3e4",
          },
          text: {
            primary: "#141416",
            secondary: "#858589",
            tertiary: "#a3a3a7",
            disabled: "#c2c2c4",
          },
          border: {
            primary: "#e0e0e2",
            secondary: "#ceced0",
          },
        },
        workflow: {
          bg: {
            primary: "#0a0a0a",
            secondary: "#111111",
            tertiary: "#1a1a1a",
            elevated: "#141414",
            hover: "#1f1f1f",
            active: "#252525",
            canvas: "#101010",
          },
          text: {
            primary: "#ffffff",
            secondary: "#a0a0a0",
            muted: "#666666",
          },
          border: {
            DEFAULT: "#2a2a2a",
            light: "#333333",
          },
          accent: {
            primary: "#6366f1",
            secondary: "#818cf8",
          },
          success: "#22c55e",
          warning: "#f59e0b",
          error: "#ef4444",
          port: "#ec4899",
          node: "#f43f5e",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        nav: "10px",
        button: "18px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0,0,0,0.05)",
        DEFAULT: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
        md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
        xl: "0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
      },
      spacing: {
        14: "3.5rem",
        18: "4.5rem",
      },
      height: {
        14: "3.5rem",
      },
      maxWidth: {
        "6xl": "72rem",
      },
      animation: {
        "fade-in-down": "fadeInDown 0.5s ease-out",
      },
      keyframes: {
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
