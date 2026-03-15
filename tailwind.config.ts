import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
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
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        medical: {
          blue: "hsl(var(--medical-blue))",
          "blue-light": "hsl(var(--medical-blue-light))",
          green: "hsl(var(--medical-green))",
          "green-light": "hsl(var(--medical-green-light))",
          navy: "hsl(var(--medical-navy))",
        },
      },
      boxShadow: {
        card:     "0 2px 12px -2px rgb(0 0 0 / 0.08), 0 1px 4px -1px rgb(0 0 0 / 0.06)",
        elevated: "0 8px 24px -4px rgb(0 0 0 / 0.12), 0 4px 8px -2px rgb(0 0 0 / 0.08)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "marquee": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-up-bounce": {
          "0%":   { opacity: "0", transform: "translateY(20px) scale(0.96)" },
          "70%":  { transform: "translateY(-4px) scale(1.01)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "shimmer-move": {
          "0%":   { backgroundPosition: "-600px 0" },
          "100%": { backgroundPosition: "600px 0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 16px hsl(var(--primary) / 0.2)" },
          "50%":      { boxShadow: "0 0 32px hsl(var(--primary) / 0.4)" },
        },
        "spin-slow": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "float":           "float 6s ease-in-out infinite",
        "pulse-soft":      "pulse-soft 3s ease-in-out infinite",
        "marquee":         "marquee 25s linear infinite",
        "fade-in":         "fade-in 0.3s ease-out both",
        "fade-in-up":      "fade-in-up 0.35s ease-out both",
        "scale-in":        "scale-in 0.2s ease-out both",
        "slide-in-right":  "slide-in-right 0.3s ease-out",
        "slide-up-bounce": "slide-up-bounce 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "shimmer-move":    "shimmer-move 1.8s ease-in-out infinite",
        "glow-pulse":      "glow-pulse 2.5s ease-in-out infinite",
        "spin-slow":       "spin-slow 8s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    "card-interactive", "kpi-card", "glass", "glass-strong",
    "shimmer-v2", "text-gradient-brand", "mesh-gradient",
    "pulse-dot", "bell-ring", "tabular-nums",
    { pattern: /^shadow-(card|elevated|glow)/ },
    { pattern: /^animate-(bell-ring|glow-pulse|float|fade-in)/ },
  ],
} satisfies Config;
