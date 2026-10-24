// Convierte los colores fijos de las hojas CSS en tokens semánticos para que
// el modo oscuro cubra todos los componentes. Uso: node scripts/design/tokenize-colors.mjs
// Clasifica cada color según la propiedad (texto, fondo, borde) y su luminancia;
// los colores de marca, estado y acento de empresa se conservan.
import fs from 'node:fs'

const FILES = ['styles.css', 'v5.css', 'v5-2.css', 'v6.css', 'v6-complete.css', 'v6-3-mobile.css'].map(f => `src/${f}`)

// Escala neutra (pasos y valor en tema claro). theme.css define el tema oscuro.
const RAMP = [
  [0, '#ffffff'], [25, '#fbfcfd'], [50, '#f8fafc'], [75, '#f3f5f8'], [100, '#f1f5f9'], [150, '#eaeef3'],
  [200, '#e2e8f0'], [250, '#d5dce6'], [300, '#cbd5e1'], [350, '#b1bccb'], [400, '#94a3b8'], [450, '#7c889b'],
  [500, '#64748b'], [550, '#56657a'], [600, '#475569'],
  [700, '#334155'], [800, '#1e293b'], [900, '#0f172a'], [950, '#020617'],
]

const hexToRgb = h => {
  h = h.slice(1)
  if (h.length <= 4) h = [...h].map(c => c + c).join('')
  const n = [0, 2, 4, 6].map(i => (i < h.length ? parseInt(h.slice(i, i + 2), 16) : 255))
  return { r: n[0], g: n[1], b: n[2], a: Math.round((n[3] / 255) * 100) / 100 }
}
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
const lstar = c => { const y = lum(c); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y }
const chroma = ({ r, g, b }) => Math.max(r, g, b) - Math.min(r, g, b)
const hue = ({ r, g, b }) => {
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b)
  if (!d) return 0
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}
// Neutro = gris puro o gris azulado de la familia slate. Los tintes claros de otro tono
// (verde éxito, rosa error, azul info) siguen siendo tintes.
const isNeutral = c => chroma(c) <= 10 || (hue(c) >= 195 && hue(c) <= 235 && chroma(c) <= (lstar(c) > 85 ? 14 : 48))
const RAMP_L = RAMP.map(([step, hex]) => [step, lstar(hexToRgb(hex))])
const nearestStep = c => { const l = lstar(c); return RAMP_L.reduce((a, b) => (Math.abs(b[1] - l) < Math.abs(a[1] - l) ? b : a))[0] }
// Texto: el paso igual o más oscuro más cercano, para no perder contraste en tema claro.
const textStep = c => { const l = lstar(c) + 2, darker = RAMP_L.filter(([, rl]) => rl <= l); return (darker.length ? darker.reduce((a, b) => (b[1] > a[1] ? b : a)) : RAMP_L[RAMP_L.length - 1])[0] }

function role(prop) {
  prop = prop.trim().toLowerCase()
  if (prop.startsWith('--')) {
    if (/text|ink|muted|subtle|fg/.test(prop)) return 'fg'
    if (/line|border/.test(prop)) return 'bd'
    if (/bg|surface|soft|white|paper|card|panel|raised|well|canvas|tint|positive/.test(prop)) return 'bg'
    return null
  }
  if (/^(color|fill|stroke|caret-color|-webkit-text-fill-color|text-decoration(-color)?)$/.test(prop)) return 'fg'
  if (/^background(-color|-image)?$/.test(prop)) return 'bg'
  if (/^(border|outline|column-rule)/.test(prop)) return 'bd'
  return null
}

function mapColor(raw, c, r, stats) {
  const L = lum(c), neutral = isNeutral(c), a = c.a
  const out = v => { stats[r] = (stats[r] || 0) + 1; return v }
  if (r === 'fg') {
    if (a < 1) return raw
    if (neutral) return L >= 0.85 ? raw : out(`var(--n-${textStep(c)})`)
    return L < 0.12 ? out(`color-mix(in oklab,${raw} var(--ink-mix),#fff)`) : raw
  }
  if (r === 'bg') {
    if (a < 1) {
      if (neutral && L >= 0.85 && a >= 0.35) return out(`rgb(var(--n-0-rgb) / ${a})`)
      if (neutral && L < 0.16 && a < 0.2) return out(`rgb(var(--n-ink-rgb) / ${a})`)
      return raw
    }
    if (neutral) return L < 0.16 ? raw : out(`var(--n-${nearestStep(c)})`)
    return L > 0.75 ? out(`color-mix(in oklab,${raw} var(--tint-mix),var(--n-0))`) : raw
  }
  if (r === 'bd') {
    if (a < 1) return neutral && L < 0.16 && a < 0.5 ? out(`rgb(var(--n-ink-rgb) / ${a})`) : raw
    if (neutral) return L < 0.16 ? raw : out(`var(--n-${nearestStep(c)})`)
    return L > 0.75 ? out(`color-mix(in oklab,${raw} var(--tint-mix),var(--n-200))`) : raw
  }
  return raw
}

// Colores fuera de un fallback var(--x,#…) para no tocar los valores por defecto de tokens existentes.
const COLOR = /(?<!var\(--[\w-]+,\s*)(#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|rgba?\(\s*\d+[\s,]+\d+[\s,]+\d+(?:\s*[,/]\s*[\d.]+%?)?\s*\)|(?<![-\w])(?:white|black)(?![-\w]))/g
const parse = s => {
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1 }
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1 }
  if (s.startsWith('#')) return hexToRgb(s)
  const n = s.match(/[\d.]+%?/g).map(x => (x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x)))
  return { r: n[0], g: n[1], b: n[2], a: n[3] ?? 1 }
}

for (const file of FILES) {
  const css = fs.readFileSync(file, 'utf8'), stats = {}
  // Recorre declaraciones prop:valor dentro de bloques; respeta selectores y @reglas.
  const next = css.replace(/([{;]\s*)([-\w]+)(\s*:\s*)([^;{}]+)/g, (m, pre, prop, colon, value) => {
    const r = role(prop)
    if (!r) return m
    return pre + prop + colon + value.replace(COLOR, raw => mapColor(raw, parse(raw), r, stats))
  })
  fs.writeFileSync(file, next)
  console.log(file.padEnd(22), JSON.stringify(stats))
}
