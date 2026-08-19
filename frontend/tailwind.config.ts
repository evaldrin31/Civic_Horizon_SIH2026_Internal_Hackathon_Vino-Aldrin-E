import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        sans: ["var(--font-inter)", "sans-serif", "Inter"],
        display: ["Public Sans", "sans-serif"],
      },
      colors: {
        "on-primary": "#ffffff",
        "tertiary-fixed-dim": "#87d7ae",
        
        "primary-fixed": "#dbe1ff",
        "on-surface": "#0b1c30",
        "on-tertiary-fixed-variant": "#005236",
        "ring-track": "#e5eeff",
        "surface-container-lowest": "#ffffff",
        "surface-container": "#e5eeff",
        
        "on-background": "#0b1c30",
        "secondary-fixed": "#abedff",
        "on-tertiary-fixed": "#002113",
        "on-primary-container": "#b8c8ff",
        "surface-container-low": "#eff4ff",
        "on-secondary": "#ffffff",
        "on-secondary-fixed-variant": "#004e5c",
        "surface-tint": "#1b55d0",
        "outline-variant": "#c3c6d6",
        "surface-glass": "rgba(255, 255, 255, 0.9)",
        "primary-container": "#004ac6",
        "tertiary-fixed": "#a3f3c9",
        "tertiary": "#00472f",
        "on-surface-variant": "#434654",
        "on-error": "#ffffff",
        "inverse-surface": "#213145",
        "error-container": "#ffdad6",
        "on-primary-fixed-variant": "#003ea8",
        "surface-container-high": "#dce9ff",
        "on-secondary-container": "#076a7c",
        "inverse-primary": "#b4c5ff",
        "secondary-container": "#9ce8fd",
        "tertiary-container": "#006141",
        "error": "#ba1a1a",
        "sensory-accent": "#00687a",
        "surface-dim": "#cbdbf5",
        "primary-fixed-dim": "#b4c5ff",
        "surface-container-highest": "#d3e4fe",
        "inverse-on-surface": "#eaf1ff",
        "on-tertiary": "#ffffff",
        "on-error-container": "#93000a",
        "secondary-fixed-dim": "#86d2e6",
        "surface": "#f8f9ff",
        "surface-bright": "#f8f9ff",
        
        "surface-variant": "#d3e4fe",
        "on-tertiary-container": "#8ad9b1",
        "on-secondary-fixed": "#001f26",
        "outline": "#737685",
        "on-primary-fixed": "#00174b",
        "mobility-accent": "#006242",
        
        
        background: "hsl(var(--background))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        status: {
          yes: "hsl(var(--status-yes))",
          no: "hsl(var(--status-no))",
          partial: "hsl(var(--status-partial))",
          unknown: "hsl(var(--status-unknown))",
          yesBg: "hsl(var(--status-yes-bg))",
          noBg: "hsl(var(--status-no-bg))",
          partialBg: "hsl(var(--status-partial-bg))",
          unknownBg: "hsl(var(--status-unknown-bg))",
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
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-bottom": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "chip-appear": {
          from: { opacity: "0", transform: "scale(0.9) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "marker-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        "count-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s ease forwards",
        "fade-in": "fade-in 0.4s ease forwards",
        "slide-right": "slide-in-right 0.4s ease forwards",
        "slide-bottom": "slide-in-bottom 0.4s ease forwards",
        "chip": "chip-appear 0.35s ease forwards",
        "marker-pulse": "marker-pulse 2s ease-in-out infinite",
        "count-in": "count-in 0.6s ease forwards",
        "scale-in": "scale-in 0.3s ease forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

