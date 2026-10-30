module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { bg: 'var(--bg)', card: 'var(--card)', line: 'var(--line)', fg: 'var(--fg)', mute: 'var(--mute)', acc: 'var(--acc)', ok: 'var(--ok)', bad: 'var(--bad)' },
    fontFamily: { sans: ['"Made Evolve Sans"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] }
  } }
}
