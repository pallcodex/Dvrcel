import { useEffect, useState } from 'react'
import { LayoutDashboard, Rocket, FolderGit2, History, Settings as Cog, PanelLeftClose, PanelLeft } from 'lucide-react'
import { api, Session } from './lib/api'
import { Logo, ThemeToggle, ToastProvider, useTheme } from './components'
import { Dashboard, Projects, HistoryPage } from './pages/Lists'
import Deploy from './pages/Deploy'
import Settings from './pages/Settings'

const NAV = [['dashboard', 'Dashboard', LayoutDashboard], ['deploy', 'Deploy', Rocket], ['projects', 'Projects', FolderGit2], ['history', 'History', History], ['settings', 'Settings', Cog]] as const

export default function App() {
  const theme = useTheme(), [page, setPage] = useState(() => location.hash.slice(1) || 'dashboard'), [open, setOpen] = useState(true)
  const [session, setSession] = useState<Session>({ connected: false })
  useEffect(() => { api<Session>('connect').then(setSession).catch(() => {}) }, [])
  const go = (p: string) => { setPage(p); location.hash = p; window.scrollTo(0, 0) }
  const view = page === 'deploy' ? <Deploy session={session} setSession={setSession} /> : page === 'projects' ? <Projects /> : page === 'history' ? <HistoryPage />
    : page === 'settings' ? <Settings session={session} setSession={setSession} theme={theme} /> : <Dashboard go={go} />
  const gate = !session.connected && (page === 'projects' || page === 'history' || page === 'dashboard')
  return <ToastProvider><div className="min-h-screen md:flex">
    <aside className={`sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r bg-card p-3 t md:flex ${open ? 'w-60' : 'w-[68px]'}`} style={{ transition: 'width .2s' }}>
      <div className="mb-6 flex items-center gap-2 px-1.5 pt-1"><Logo />{open && <span className="text-lg font-bold tracking-tight">Dvrcel</span>}</div>
      <nav className="flex-1 space-y-1">{NAV.map(([id, l, I]) => <button key={id} onClick={() => go(id)} title={l} className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm font-medium t ${page === id ? 'bg-acc/10 text-acc' : 'text-mute hover:text-fg'}`}><I size={18} className="shrink-0" />{open && l}</button>)}</nav>
      <div className="flex items-center gap-2"><ThemeToggle t={theme} />{open && <button className="btn-g ml-auto !px-0 w-11" onClick={() => setOpen(false)} aria-label="Ciutkan"><PanelLeftClose size={18} /></button>}
        {!open && <button className="btn-g !px-0 w-11" onClick={() => setOpen(true)} aria-label="Perluas"><PanelLeft size={18} /></button>}</div></aside>
    <div className="min-w-0 flex-1">
      <header className="glass sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 md:hidden" style={{ paddingTop: 'max(.75rem, env(safe-area-inset-top))' }}>
        <div className="flex items-center gap-2"><Logo size={26} /><span className="font-bold">Dvrcel</span></div><ThemeToggle t={theme} /></header>
      <main className="px-4 pb-28 pt-6 md:px-10 md:pb-12 md:pt-10">
        {gate && page !== 'dashboard' ? <div className="page mx-auto max-w-lg"><div className="card p-6 text-center"><p className="mb-4 text-sm text-mute">Data berasal dari akun Vercel Anda. Hubungkan token terlebih dahulu.</p><button className="btn-p" onClick={() => go('deploy')}>Hubungkan Vercel</button></div></div> : view}</main></div>
    <nav className="glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {NAV.map(([id, l, I]) => <button key={id} onClick={() => go(id)} className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${page === id ? 'text-acc' : 'text-mute'}`}><I size={20} />{l}</button>)}</nav>
  </div></ToastProvider>
}
