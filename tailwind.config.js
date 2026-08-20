/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F1A",
        surface: "#141A2A",
        raised: "#1B2338",
        border: "#2A3350",
        muted: "#8992AC",
        ivory: "#E9ECF5",
        violet: "#7C5CFF",
        violetdeep: "#5B3FE0",
        teal: "#2DD4BF",
        amber: "#F5A623",
        rose: "#FB5A75",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,92,255,0.25), 0 8px 30px -6px rgba(124,92,255,0.35)",
      },
      keyframes: {
        dash: {
          to: { strokeDashoffset: "-24" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        dash: "dash 1.2s linear infinite",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        "fade-up": "fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pop-in": "popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
