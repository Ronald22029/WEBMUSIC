import type { Config } from 'tailwindcss'
export default {
  content: ['./app/**/*.{vue,ts}', './components/**/*.{vue,ts}', './pages/**/*.{vue,ts}', './layouts/**/*.{vue,ts}'],
  theme: { extend: { fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] } } },
  plugins: []
} satisfies Config
