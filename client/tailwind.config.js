/** @type {import('tailwindcss').Config} */
export default {
  // Content paths cover all source files where Tailwind classes are used,
  // including responsive utilities for mobile, tablet, and desktop layouts.
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // Default Tailwind screens align with the responsive breakpoints in
    // Requirement 16: mobile (<768px), tablet (768-1023px => md),
    // desktop (>=1024px => lg). The defaults below are retained so all
    // breakpoints (sm/md/lg/xl/2xl) remain available for responsive UI.
    screens: {
      sm: '640px',
      md: '768px', // tablet start
      lg: '1024px', // desktop start
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {},
  },
  plugins: [],
}
