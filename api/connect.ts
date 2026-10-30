import { handler, setSession, getToken, vercel, HttpError } from './_lib'

// GET: status koneksi | POST: verifikasi & simpan token | DELETE: putuskan
export default handler(async (req, res) => {
  const pub = (d: any) => ({ connected: true, user: { username: d.user.username, name: d.user.name } })
  if (req.method === 'POST') {
    const token = String(req.body?.token || '').trim()
    if (token.length < 20 || token.length > 300 || /\s/.test(token)) throw new HttpError(400, 'Format token tidak valid.')
    const d = await vercel(token, '/v2/user')
    setSession(res, token)
    return pub(d)
  }
  if (req.method === 'DELETE') { setSession(res, null); return { connected: false } }
  try { return pub(await vercel(getToken(req), '/v2/user')) } catch { return { connected: false } }
}, 20)
