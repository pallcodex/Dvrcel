import { useState } from 'react'
import { Eye, EyeOff, Link2, Unlink, KeyRound } from 'lucide-react'
import { api, Session } from '../lib/api'
import { useToast } from '../components'

export default function Connect({ session, setSession }: { session: Session; setSession: (s: Session) => void }) {
  const [token, setToken] = useState(''), [show, setShow] = useState(false), [busy, setBusy] = useState(false), toast = useToast()
  const act = async (disc: boolean) => {
    setBusy(true)
    try {
      const s = await api<Session>('connect', disc ? { method: 'DELETE' } : { method: 'POST', body: { token } })
      setSession(s); setToken(''); toast(disc ? 'Koneksi diputuskan.' : `Terhubung sebagai ${s.user?.username}.`)
    } catch (e: any) { toast(e.message, true) } finally { setBusy(false) }
  }
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold"><KeyRound size={18} /> Vercel Connection</h2>
        <span className={`text-xs font-semibold ${session.connected ? 'text-ok' : 'text-mute'}`}>{session.connected ? `Connected: ${session.user?.username}` : 'Disconnected'}</span>
      </div>
      {session.connected ? <button className="btn-g" disabled={busy} onClick={() => act(true)}><Unlink size={16} /> Disconnect</button> : (
        <div className="space-y-3">
          <label className="lbl" htmlFor="tok">Personal Access Token</label>
          <div className="flex gap-2">
            <input id="tok" className="inp" type={show ? 'text' : 'password'} value={token} onChange={e => setToken(e.target.value)} autoComplete="off" spellCheck={false} placeholder="Tempel token Vercel" />
            <button className="btn-g !px-0 w-11 shrink-0" onClick={() => setShow(!show)} aria-label="Tampilkan token">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <p className="text-xs text-mute">Token diverifikasi oleh server lalu disimpan terenkripsi di cookie HttpOnly. Tidak disimpan di localStorage dan tidak pernah dikirim balik ke browser.</p>
          <button className="btn-p" disabled={busy || token.length < 20} onClick={() => act(false)}><Link2 size={16} /> {busy ? 'Memverifikasi...' : 'Connect'}</button>
        </div>)}
    </section>)
}
