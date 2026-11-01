/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      colors: {
        background: 'var(--background)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          text: 'var(--secondary-text)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          light: 'var(--accent-light)',
        },
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        border: {
          DEFAULT: 'var(--border)',
          hover: 'var(--border-hover)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      borderRadius: {
        'card': '18px',
        'card-lg': '22px',
      },
      boxShadow: {
        'subtle': '0 2px 8px -1px rgba(0, 0, 0, 0.04), 0 1px 3px -1px rgba(0, 0, 0, 0.02)',
        'card': '0 4px 20px -2px rgba(113, 59, 112, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 10px 30px -4px rgba(113, 59, 112, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
        'dropdown': '0 12px 36px -6px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
        'dialog': '0 24px 60px -12px rgba(0, 0, 0, 0.25)',
      },
      transitionTimingFunction: {
        'festiva': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
