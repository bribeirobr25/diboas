/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Define custom colors used in our design system
      colors: {
        'diboas': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      // Limit font sizes to what we actually use
      fontSize: {
        'xs': ['0.75rem', '1rem'],
        'sm': ['0.875rem', '1.25rem'],
        'base': ['1rem', '1.5rem'],
        'lg': ['1.125rem', '1.75rem'],
        'xl': ['1.25rem', '1.75rem'],
        '2xl': ['1.5rem', '2rem'],
        '3xl': ['1.875rem', '2.25rem'],
        '4xl': ['2.25rem', '2.5rem'],
      },
      // Limit spacing to what we actually use
      spacing: {
        '0': '0px',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '7': '1.75rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '32': '8rem',
        '40': '10rem',
        '48': '12rem',
        '56': '14rem',
        '64': '16rem',
        '96': '24rem',
      }
    },
  },
  plugins: [],
  // Safelist for dynamic classes that might not be detected by content scanning
  safelist: [
    // Semantic classes we created (preserve all custom design system classes)
    {
      pattern: /^(page|transaction|account|payment|performance|error|dashboard|semantic|balance|portfolio|form|button|nav|modal|status|alert|loading|empty)-/
    },
    // Dynamic color classes used in JavaScript
    {
      pattern: /^(bg|text|border)-(blue|purple|green|red|orange|yellow|indigo|emerald|cyan|gray)-(50|100|200|300|400|500|600|700|800|900)$/
    },
    // Responsive prefixes for dynamic classes
    {
      pattern: /^(sm|md|lg|xl):(bg|text|border)-(blue|purple|green|red|orange|yellow|indigo|emerald|cyan|gray)-(50|100|200|300|400|500|600|700|800|900)$/
    },
    // Animation classes
    'animate-spin',
    'animate-pulse',
    'animate-bounce',
    // Utility classes that might be generated dynamically
    'sr-only',
    'not-sr-only',
    'group',
    'peer',
    // Radix UI and component library classes
    {
      pattern: /^radix-/
    },
    {
      pattern: /^data-/
    },
    {
      pattern: /^aria-/
    }
  ]
}