import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        eid: {
          emerald: "#05603a",
          jade: "#0f8a5f",
          gold: "#f8c84c",
          cream: "#fff8df",
          ink: "#123228"
        }
      },
      boxShadow: {
        glow: "0 24px 80px rgba(248, 200, 76, 0.28)"
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        twinkle: "twinkle 2.6s ease-in-out infinite",
        rise: "rise 850ms ease-out both"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" }
        },
        twinkle: {
          "0%, 100%": { opacity: "0.35", transform: "scale(0.92)" },
          "50%": { opacity: "1", transform: "scale(1.12)" }
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      }
    }
  },
  plugins: []
};

export default config;
