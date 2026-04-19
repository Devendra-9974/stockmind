/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0d1117',
        card:    '#161b22',
        border:  '#30363d',
        muted:   '#8b949e',
        accent:  '#58a6ff',
        green:   '#3fb950',
        red:     '#f85149',
        amber:   '#d29922',
        purple:  '#bc8cff',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    }
  },
  plugins: []
}
