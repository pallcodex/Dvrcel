const v = (n) => ({ opacityValue }) => opacityValue === undefined ? `var(--${n})` : `color-mix(in srgb, var(--${n}) calc(${opacityValue} * 100%), transparent)`
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { bg: v('bg'), card: v('card'), line: v('line'), fg: v('fg'), mute: v('mute'), acc: v('acc'), on: v('on'), ok: v('ok'), bad: v('bad') },
    fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] }
  } }
}
