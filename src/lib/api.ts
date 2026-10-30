export type Dep = { id: string; name: string; url: string | null; state: string; createdAt: number; duration: number | null; inspectorUrl: string | null; error: string | null }
export type Proj = { id: string; name: string; framework: string | null; url: string | null; state: string | null; deployedAt: number | null; latestId: string | null }
export type Session = { connected: boolean; user?: { username: string; name: string } }

export async function api<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const r = await fetch('/api/' + path, { method: init?.method || 'GET', credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined, body: init?.body ? JSON.stringify(init.body) : undefined })
  let d: any = null
  try { d = await r.json() } catch { /* non-JSON */ }
  if (!r.ok) throw new Error(d?.error || `Request gagal (${r.status}). Pastikan backend /api berjalan (gunakan "vercel dev").`)
  return d
}
export const fmtSize = (n: number) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(2)} MB`
export const fmtTime = (t?: number | null) => t ? new Date(t).toLocaleString((document.documentElement.lang === 'en' ? 'en-US' : 'id-ID'), { dateStyle: 'medium', timeStyle: 'short' }) : '-'
export const fmtDur = (ms?: number | null) => ms ? `${Math.round(ms / 1000)} ${document.documentElement.lang === 'en' ? 's' : 'dtk'}` : '-'
export const toB64 = (f: File) => new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = () => no(r.error); r.readAsDataURL(f) })
export const stateKind = (s?: string | null) => s === 'READY' ? 'ready' : s === 'ERROR' || s === 'CANCELED' ? 'error' : 'building'
