import { Moon, Sun, Monitor } from 'lucide-react'
import { Session } from '../lib/api'
import { useTheme } from '../components'
import { useI18n, Lang } from '../lib/i18n'
import Connect from './Connect'

export default function Settings({ session, setSession, theme }: { session: Session; setSession: (s: Session) => void; theme: ReturnType<typeof useTheme> }) {
  const { t, lang, setLang } = useI18n(), on = 'border-transparent bg-acc text-white'
  const sys = () => { try { localStorage.removeItem('dvrcel-theme') } catch { /* */ } theme.set(matchMedia('(prefers-color-scheme: dark)').matches); try { localStorage.removeItem('dvrcel-theme') } catch { /* */ } }
  return <div className="page mx-auto max-w-3xl space-y-5"><h1 className="text-2xl font-bold">{t('st.title')}</h1>
    <section className="card p-5"><h2 className="mb-2 font-semibold">{t('st.acc')}</h2>
      {session.connected ? <p className="text-sm">{session.user?.name || session.user?.username} <span className="text-mute">(@{session.user?.username})</span></p> : <p className="text-sm text-mute">{t('st.accNone')}</p>}</section>
    <Connect session={session} setSession={setSession} />
    <section className="card p-5"><h2 className="font-semibold">{t('st.theme')}</h2><p className="mb-3 mt-1 text-sm text-mute">{t('st.themeHint')}</p>
      <div className="flex flex-wrap gap-2">{([['light', t('st.light'), Sun], ['dark', t('st.dark'), Moon]] as const).map(([v, l, I]) =>
        <button key={v} onClick={() => theme.set(v === 'dark')} className={`btn ${(theme.dark ? 'dark' : 'light') === v ? on : 'bg-card'}`}><I size={16} /> {l}</button>)}
        <button className="btn-g" onClick={sys}><Monitor size={16} /> {t('st.system')}</button></div></section>
    <section className="card p-5"><h2 className="font-semibold">{t('st.lang')}</h2><p className="mb-3 mt-1 text-sm text-mute">{t('st.langHint')}</p>
      <div className="flex gap-2">{([['id', 'Bahasa Indonesia'], ['en', 'English']] as [Lang, string][]).map(([v, l]) =>
        <button key={v} onClick={() => setLang(v)} className={`btn ${lang === v ? on : 'bg-card'}`}>{l}</button>)}</div></section>
    <section className="card p-5"><h2 className="mb-2 font-semibold">{t('st.prefs')}</h2><p className="text-sm text-mute">{t('st.prefsText')}</p></section>
    <section className="card p-5"><h2 className="mb-2 font-semibold">{t('st.about')}</h2><p className="text-sm text-mute">{t('st.aboutText')}</p><p className="mt-2 text-xs text-mute">{t('st.version')} 1.1.0</p></section></div>
}
