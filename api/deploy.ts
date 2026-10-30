import crypto from 'node:crypto'
import AdmZip from 'adm-zip'
import { handler, getToken, vercel, HttpError } from './_lib'

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } } // batas body Vercel Functions: 4.5MB
const MAX_FILES = 400, MAX_UNZIPPED = 25 * 1024 * 1024
const BLOCKED = /\.(exe|dll|bat|cmd|sh|msi|com|scr|php|jar|apk)$/i
const SKIP = /(^|\/)(\.env[^/]*|\.git(\/|$)|node_modules\/|__MACOSX\/|\.DS_Store$)/
const FRAMEWORKS = ['static', 'vite', 'nextjs', 'create-react-app', 'nuxtjs', 'svelte', 'astro', 'vue', 'angular', 'gatsby']
const clean = (p: string) => {
  const n = p.replace(/^\.?\/+/, '')
  if (!n || n.includes('\\') || n.includes('\0') || n.split('/').some(s => s === '..' || s === '')) throw new HttpError(400, `Path tidak aman ditolak: ${p.slice(0, 60)}`)
  return n
}

export default handler(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method tidak diizinkan.')
  const token = getToken(req), b = req.body || {}
  const name = String(b.projectName || '').toLowerCase()
  if (!/^[a-z0-9][a-z0-9._-]{0,99}$/.test(name) || name.includes('---')) throw new HttpError(400, 'Nama project: huruf kecil, angka, ".", "_", "-", maks 100 karakter, tanpa "---".')
  const fw = FRAMEWORKS.includes(b.framework) ? b.framework : 'static'
  const str = (v: any) => (typeof v === 'string' && v.trim() && v.length < 200 && !/[\n\r\0]/.test(v) ? v.trim() : null)
  if (!Array.isArray(b.files) || !b.files.length) throw new HttpError(400, 'Tidak ada file.')

  // 1. Kumpulkan & validasi file (ZIP diekstrak di server)
  let files = new Map<string, Buffer>()
  for (const f of b.files) {
    if (typeof f?.name !== 'string' || typeof f?.data !== 'string') throw new HttpError(400, 'Data file tidak valid.')
    const buf = Buffer.from(f.data, 'base64')
    if (/\.zip$/i.test(f.name)) {
      let zip: AdmZip
      try { zip = new AdmZip(buf) } catch { throw new HttpError(400, 'ZIP rusak atau tidak valid.') }
      const entries = zip.getEntries().filter(e => !e.isDirectory)
      if (entries.reduce((s, e) => s + e.header.size, 0) > MAX_UNZIPPED) throw new HttpError(400, 'Isi ZIP terlalu besar (maks 25MB setelah ekstrak).')
      for (const e of entries) { const p = clean(e.entryName); if (!SKIP.test(p)) files.set(p, e.getData()) }
    } else files.set(clean(f.name), buf)
    if (files.size > MAX_FILES) throw new HttpError(400, `Terlalu banyak file (maks ${MAX_FILES}).`)
  }
  for (const p of files.keys()) if (BLOCKED.test(p)) throw new HttpError(400, `Tipe file tidak diizinkan: ${p}`)
  const tops = new Set([...files.keys()].map(p => p.split('/')[0]))
  if (tops.size === 1 && ![...files.keys()].some(p => !p.includes('/'))) { // buang folder root tunggal
    const t = [...tops][0] + '/'; files = new Map([...files].map(([p, v]) => [p.slice(t.length), v]))
  }
  const htmls = [...files.keys()].filter(p => /\.html?$/i.test(p) && !p.includes('/'))
  if (fw === 'static' && !files.has('index.html')) {
    if (htmls.length === 1) { files.set('index.html', files.get(htmls[0])!); files.delete(htmls[0]) }
    else throw new HttpError(400, 'index.html tidak ditemukan di root project. Periksa struktur ZIP Anda.')
  }
  if (fw !== 'static' && !files.has('package.json')) throw new HttpError(400, 'package.json tidak ditemukan untuk framework preset ini.')

  // 2. Favicon opsional: file ditambahkan dan <link rel="icon"> disuntikkan ke index.html
  if (b.favicon?.data) {
    const ext = String(b.favicon.name).split('.').pop()?.toLowerCase()
    if (!['png', 'ico', 'svg'].includes(ext || '')) throw new HttpError(400, 'Favicon harus PNG, ICO, atau SVG.')
    files.set(`favicon.${ext}`, Buffer.from(b.favicon.data, 'base64'))
    const idx = files.get('index.html')
    if (idx) {
      const tag = `<link rel="icon" href="/favicon.${ext}">`
      const html = idx.toString('utf8').replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/gi, '')
      files.set('index.html', Buffer.from(/<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${tag}</head>`) : tag + html))
    }
  }

  // 3. Upload file (SHA1) ke Vercel: POST /v2/files
  const list = [...files].map(([file, buf]) => ({ file, buf, sha: crypto.createHash('sha1').update(buf).digest('hex') }))
  for (let i = 0; i < list.length; i += 8)
    await Promise.all(list.slice(i, i + 8).map(f => vercel(token, '/v2/files', { method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(f.buf.length), 'x-vercel-digest': f.sha }, body: f.buf as unknown as BodyInit })))

  // 4. Buat deployment: POST /v13/deployments
  const st = fw === 'static'
  const d = await vercel(token, '/v13/deployments', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, target: 'production', files: list.map(f => ({ file: f.file, sha: f.sha, size: f.buf.length })),
      projectSettings: { framework: st ? null : fw, buildCommand: st ? null : str(b.buildCommand),
        outputDirectory: st ? null : str(b.outputDirectory), rootDirectory: str(b.rootDirectory) } }) })
  return { deployment: { id: d.id, url: `https://${d.url}`, state: d.readyState, inspectorUrl: d.inspectorUrl || null }, fileCount: list.length }
}, 10)
