/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        raised: v("raised"),
        ink: v("ink"),
        muted: v("muted"),
        faint: v("faint"),
        line: v("line"),
        accent: v("accent"),
        "accent-ink": v("accent-ink"),
        danger: v("danger"),
      },
      fontFamily: {
        display: ['"Zodiak"', "Georgia", "serif"],
        sans: ['"General Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)", "1.5"],
        sm: ["clamp(0.875rem, 0.8rem + 0.35vw, 1rem)", "1.5"],
        base: ["clamp(1rem, 0.95rem + 0.25vw, 1.125rem)", "1.6"],
        lg: ["clamp(1.125rem, 1rem + 0.75vw, 1.5rem)", "1.35"],
        xl: ["clamp(1.5rem, 1.2rem + 1.25vw, 2.25rem)", "1.15"],
        "2xl": ["clamp(2rem, 1.2rem + 2.5vw, 3.5rem)", "1.05"],
        "3xl": ["clamp(2.5rem, 1rem + 4vw, 5rem)", "1"],
      },
      maxWidth: { page: "1240px" },
    },
  },
  plugins: [],
};
