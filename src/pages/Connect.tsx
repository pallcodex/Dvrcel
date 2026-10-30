import { useState } from 'react'
import { Eye, EyeOff, Link2, Unlink, KeyRound } from 'lucide-react'
import { api, Session } from '../lib/api'
import { useToast } from '../components'
import { useI18n } from '../lib/i18n'

export default function Connect({ session, setSession }: { session: Session; setSession: (s: Session) => void }) {
  const [token, setToken] = useState(''), [show, setShow] = useState(false), [busy, setBusy] = useState(false), toast = useToast(), { t } = useI18n()
  const act = async (disc: boolean) => {
    setBusy(true)
    try {
      const s = await api<Session>('connect', disc ? { method: 'DELETE' } : { method: 'POST', body: { token } })
      setSession(s); setToken(''); toast(disc ? t('c.offToast') : t('c.okToast', { n: s.user?.username || '' }))
    } catch (e: any) { toast(e.message, true) } finally { setBusy(false) }
  }
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold"><KeyRound size={18} /> {t('c.title')}</h2>
        <span className={`text-xs font-semibold ${session.connected ? 'text-ok' : 'text-mute'}`}>{session.connected ? `${t('c.on')}: ${session.user?.username}` : t('c.off')}</span>
      </div>
      {session.connected ? <div className="space-y-3"><p className="text-xs text-mute">{t('c.hint')}</p><button className="btn-g" disabled={busy} onClick={() => act(true)}><Unlink size={16} /> {t('c.disconnect')}</button></div> : (
        <div className="space-y-3">
          <p className="text-sm text-mute">{t('c.how')}</p>
          <label className="lbl" htmlFor="tok">{t('c.label')}</label>
          <div className="flex gap-2">
            <input id="tok" className="inp" type={show ? 'text' : 'password'} value={token} onChange={e => setToken(e.target.value)} autoComplete="off" spellCheck={false} placeholder={t('c.ph')} />
            <button className="btn-g !px-0 w-11 shrink-0" onClick={() => setShow(!show)} aria-label={t('c.show')}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
          <p className="text-xs text-mute">{t('c.hint')}</p>
          <button className="btn-p" disabled={busy || token.length < 20} onClick={() => act(false)}><Link2 size={16} /> {busy ? t('c.verifying') : t('c.connect')}</button>
        </div>)}
    </section>)
}
