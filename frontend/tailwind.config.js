/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#00d4ff",
        "accent-hover": "#00b8e6",
        "accent-dim": "#00a3c4",
        "accent-muted": "rgba(0, 212, 255, 0.15)",
        surface: "#111318",
        danger: "#ef4444",
        success: "#22c55e",
        warning: "#eab308",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "fade-up": "fadeUp 0.25s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-out-right": "slideOutRight 0.3s ease-in forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
        "number-tick": "numberTick 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideOutRight: {
          "0%": { opacity: "1", transform: "translateX(0)" },
          "100%": { opacity: "0", transform: "translateX(100%)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 4px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 12px rgba(0, 212, 255, 0.6)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        numberTick: {
          "0%": { transform: "translateY(-4px)", opacity: "0.6" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 8px rgba(0, 212, 255, 0.3)",
        "glow-md": "0 0 16px rgba(0, 212, 255, 0.35)",
        "glow-lg": "0 0 24px rgba(0, 212, 255, 0.4)",
      },
    },
  },
  plugins: [],
};
