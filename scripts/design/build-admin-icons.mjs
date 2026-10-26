// Genera public/nexus-admin-icons.js con iconos Lucide (los mismos del catálogo)
// para el panel de administración, que es HTML estático sin React.
// Uso: node scripts/design/build-admin-icons.mjs
import fs from 'node:fs'

const ICONS = ['refresh-cw','plug-zap','sun','moon','search','x','chevron-left','chevron-right','chevron-down','image-off',
  'package','package-check','package-x','badge-percent','layout-dashboard','store','star','pencil','key-round','check',
  'truck','credit-card','megaphone','images','layout-panel-top','shield-check','terminal','tags','circle-check','circle-alert']

const dir = 'node_modules/lucide-react/dist/esm/icons'
const out = {}
for (const name of ICONS) {
  const src = fs.readFileSync(`${dir}/${name}.js`, 'utf8')
  const body = src.slice(src.indexOf('[', src.indexOf('createLucideIcon(')), src.lastIndexOf(']') + 1)
  const nodes = Function(`return ${body}`)()
  out[name] = nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('')
}
const license = fs.readFileSync('node_modules/lucide-react/LICENSE', 'utf8').trim().split('\n').map(l => ` * ${l}`.trimEnd()).join('\n')
fs.writeFileSync('public/nexus-admin-icons.js', `/* Iconos Lucide (lucide-react 0.468.0) generados por scripts/design/build-admin-icons.mjs.
${license}
 */
window.CUYRA_ICONS=${JSON.stringify(out)};
`)
console.log('icons:', Object.keys(out).length)
