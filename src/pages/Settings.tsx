import { Moon, Sun, Monitor } from 'lucide-react'
import { Session } from '../lib/api'
import { useTheme } from '../components'
import Connect from './Connect'

export default function Settings({ session, setSession, theme }: { session: Session; setSession: (s: Session) => void; theme: ReturnType<typeof useTheme> }) {
  return <div className="page mx-auto max-w-3xl space-y-5"><h1 className="text-2xl font-bold">Settings</h1>
    <section className="card p-5"><h2 className="mb-2 font-semibold">Account</h2>
      {session.connected ? <p className="text-sm">{session.user?.name || session.user?.username} <span className="text-mute">(@{session.user?.username})</span></p> : <p className="text-sm text-mute">Belum terhubung ke Vercel. Dvrcel tidak memakai login terpisah; identitas berasal dari token Vercel Anda.</p>}</section>
    <Connect session={session} setSession={setSession} />
    <section className="card p-5"><h2 className="mb-3 font-semibold">Theme Preferences</h2>
      <div className="flex gap-2">{([['light', 'Light', Sun], ['dark', 'Dark', Moon]] as const).map(([v, l, I]) =>
        <button key={v} onClick={() => theme.set(v === 'dark')} className={`btn ${(theme.dark ? 'dark' : 'light') === v ? 'bg-acc text-white border-transparent' : 'bg-card'}`}><I size={16} /> {l}</button>)}
        <button className="btn-g" onClick={() => { localStorage.removeItem('dvrcel-theme'); theme.set(matchMedia('(prefers-color-scheme: dark)').matches); localStorage.removeItem('dvrcel-theme') }}><Monitor size={16} /> Sistem</button></div></section>
    <section className="card p-5"><h2 className="mb-2 font-semibold">Deployment Preferences</h2>
      <p className="text-sm text-mute">Target deployment: <b className="text-fg">production</b>. Batas upload: 3 MB per deployment (batas request body Vercel Functions 4.5 MB). Opsi lain belum tersedia.</p></section>
    <section className="card p-5"><h2 className="mb-2 font-semibold">About Dvrcel</h2><p className="text-sm text-mute">Dvrcel v1.0.0 · Upload. Deploy. Go Live. Menggunakan Vercel REST API.</p></section></div>
}
