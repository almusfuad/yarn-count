/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary gradient colors
        primary: {
          900: '#1a0533',
          800: '#3b1a6e',
          700: '#5a2d9e',
        },
        // Accent colors
        accent: {
          orange: '#ff9800',
          amber: '#fbbf24',
          emerald: '#10b981',
          red: '#ef4444',
        },
        // Neutral grays (from Tailwind defaults + custom)
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          150: '#f0f0f0',
          200: '#e5e7eb',
          400: '#9ca3af',
          500: '#6b7280',
        },
      },
      spacing: {
        '3.75': '15px',
      },
      boxShadow: {
        'sm': '0 1px 4px rgba(0, 0, 0, 0.08)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.15)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xs': '6px',
        'sm': '8px',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        pulse: 'pulse 2s infinite',
      },
    },
  },
  plugins: [],
}
