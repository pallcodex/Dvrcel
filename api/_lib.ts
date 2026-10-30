import crypto from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const COOKIE = 'dvrcel_session'
export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg) } }
const key = () => {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new HttpError(500, 'SESSION_SECRET belum diatur di server (min 32 karakter).')
  return crypto.createHash('sha256').update(s).digest()
}

// Token dienkripsi AES-256-GCM dan disimpan di cookie HttpOnly. JavaScript browser tidak bisa membacanya.
function seal(text: string) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('base64url')
}
function unseal(v: string) {
  const b = Buffer.from(v, 'base64url'), d = crypto.createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12))
  d.setAuthTag(b.subarray(12, 28))
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')
}
export function setSession(res: VercelResponse, token: string | null) {
  res.setHeader('Set-Cookie', `${COOKIE}=${token ? seal(token) : ''}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=${token ? 604800 : 0}`)
}
export function getToken(req: VercelRequest): string {
  const m = (req.headers.cookie || '').match(new RegExp(`${COOKIE}=([^;]+)`))
  if (!m) throw new HttpError(401, 'Vercel belum terhubung. Hubungkan token terlebih dahulu.')
  try { return unseal(m[1]) } catch (e) { if (e instanceof HttpError) throw e; throw new HttpError(401, 'Sesi tidak valid. Hubungkan ulang token Anda.') }
}

// Rate limit in-memory per IP (best effort: per instance serverless).
const hits = new Map<string, { n: number; t: number }>()
function rateLimit(req: VercelRequest, bucket: string, max: number, windowMs = 60_000) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim()
  const k = bucket + ip, now = Date.now(), h = hits.get(k)
  if (!h || now - h.t > windowMs) { hits.set(k, { n: 1, t: now }); return }
  if (++h.n > max) throw new HttpError(429, 'Terlalu banyak request. Coba lagi sebentar lagi.')
}
function sameOrigin(req: VercelRequest) {
  if (req.method === 'GET') return
  const o = req.headers.origin
  if (o && new URL(o).host !== req.headers.host) throw new HttpError(403, 'Origin tidak diizinkan.')
}

// Request ke Vercel REST API. Error disanitasi; token tidak pernah masuk ke pesan/log.
export async function vercel(token: string, path: string, init: RequestInit = {}) {
  const r = await fetch('https://api.vercel.com' + path, { ...init, headers: { Authorization: `Bearer ${token}`, ...((init.headers as Record<string, string>) || {}) } })
  const text = await r.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!r.ok) throw new HttpError(r.status === 401 || r.status === 403 ? 401 : r.status >= 500 ? 502 : 400, data?.error?.message || `Vercel API error (${r.status})`)
  return data
}

export function handler(fn: (req: VercelRequest, res: VercelResponse) => Promise<any>, limit = 60) {
  return async (req: VercelRequest, res: VercelResponse) => {
    res.setHeader('Cache-Control', 'no-store')
    try { sameOrigin(req); rateLimit(req, (req.url || '').split('?')[0], limit); res.status(200).json(await fn(req, res)) }
    catch (e: any) {
      if (!(e instanceof HttpError)) console.error('Unhandled error:', e?.message)
      res.status(e instanceof HttpError ? e.status : 500).json({ error: e instanceof HttpError ? e.message : 'Terjadi kesalahan pada server.' })
    }
  }
}
