/** Reports production bundle sizes: total dist, initial JS (entry + static imports), lazy chunks, largest assets. */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'

const dist = path.resolve('dist')
if (!fs.existsSync(dist)) {
  console.error('dist/ not found — run npm run build first')
  process.exit(1)
}
const files = []
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p)
    else files.push({ p, rel: path.relative(dist, p), size: st.size })
  }
}
walk(dist)
const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const total = files.reduce((s, f) => s + f.size, 0)
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const initial = new Set([...html.matchAll(/(?:src|href)="\.\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]))
// follow static imports of initial JS chunks
const queue = [...initial].filter((f) => f.endsWith('.js'))
while (queue.length) {
  const f = queue.pop()
  const code = fs.readFileSync(path.join(dist, f), 'utf8')
  for (const m of code.matchAll(/(?:^|[;\n])\s*import\s*(?:[\w*{}\s,$]+from\s*)?["']\.\/([^"']+\.js)["']/g)) {
    const dep = 'assets/' + m[1]
    if (!initial.has(dep)) {
      initial.add(dep)
      queue.push(dep)
    }
  }
}
const gz = (f) => zlib.gzipSync(fs.readFileSync(path.join(dist, f))).length
const initFiles = files.filter((f) => initial.has(f.rel.replace(/\\/g, '/')))
const initialJs = initFiles.filter((f) => f.rel.endsWith('.js'))
const initialSize = initialJs.reduce((s, f) => s + f.size, 0)
const initialGz = initialJs.reduce((s, f) => s + gz(f.rel.replace(/\\/g, '/')), 0)
const js = files.filter((f) => f.rel.endsWith('.js'))
const lazy = js.filter((f) => !initial.has(f.rel.replace(/\\/g, '/')))
console.log('================ BUNDLE REPORT ================')
console.log(`Total dist size     : ${kb(total)} (${(total / 1024 / 1024).toFixed(2)} MB) in ${files.length} files`)
console.log(`Initial JS          : ${kb(initialSize)} (gzip ${kb(initialGz)}) — ${initialJs.map((f) => path.basename(f.rel)).join(', ')}`)
console.log(`Initial CSS         : ${kb(initFiles.filter((f) => f.rel.endsWith('.css')).reduce((s, f) => s + f.size, 0))}`)
console.log(`Lazy JS chunks      : ${lazy.length} files, ${kb(lazy.reduce((s, f) => s + f.size, 0))}`)
console.log(`Fonts               : ${kb(files.filter((f) => f.rel.endsWith('.woff2')).reduce((s, f) => s + f.size, 0))} (browser downloads only needed subsets)`)
console.log('Largest assets:')
for (const f of [...files].sort((a, b) => b.size - a.size).slice(0, 10)) console.log(`  ${kb(f.size).padStart(10)}  ${f.rel}${initial.has(f.rel.replace(/\\/g, '/')) ? '  [initial]' : ''}`)
console.log(`Budget 20 MB        : ${total <= 20 * 1024 * 1024 ? 'OK' : 'EXCEEDED'}`)
