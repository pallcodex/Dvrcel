import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Sun, Moon, X } from 'lucide-react'
import { stateKind } from './lib/api'

export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden><rect width="32" height="32" rx="9" fill="var(--acc)" />
    <path d="M10 22V10h5.5a6 6 0 0 1 0 12z" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M18 15.5l3-3 3 3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>)

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const set = (d: boolean) => { document.documentElement.classList.toggle('dark', d); try { localStorage.setItem('dvrcel-theme', d ? 'dark' : 'light') } catch { /* */ } setDark(d) }
  return { dark, set, toggle: () => set(!dark) }
}
export const ThemeToggle = ({ t }: { t: ReturnType<typeof useTheme> }) => (
  <button className="btn-g !px-0 w-11" onClick={t.toggle} aria-label="Ganti tema">{t.dark ? <Sun size={18} /> : <Moon size={18} />}</button>)

export const Badge = ({ state }: { state?: string | null }) => {
  const k = stateKind(state), c = k === 'ready' ? 'text-ok' : k === 'error' ? 'text-bad' : 'text-acc'
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c}`}>
    <span className={`h-1.5 w-1.5 rounded-full bg-current ${k === 'building' ? 'animate-pulse' : ''}`} />{state || 'Belum ada'}</span>
}

type Toast = { id: number; msg: string; err?: boolean }
const ToastCtx = createContext<(m: string, err?: boolean) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [ts, setTs] = useState<Toast[]>([])
  const push = useCallback((msg: string, err?: boolean) => { const id = Date.now() + Math.random(); setTs(t => [...t, { id, msg, err }]); setTimeout(() => setTs(t => t.filter(x => x.id !== id)), 4500) }, [])
  return <ToastCtx.Provider value={push}>{children}
    <div className="fixed inset-x-3 bottom-20 z-50 flex flex-col items-center gap-2 md:bottom-6 md:items-end" role="status">
      {ts.map(t => <div key={t.id} className={`page card glass flex max-w-sm items-start gap-3 px-4 py-3 text-sm ${t.err ? 'text-bad' : ''}`}>
        <span className="flex-1">{t.msg}</span><button onClick={() => setTs(x => x.filter(y => y.id !== t.id))} aria-label="Tutup"><X size={14} /></button></div>)}
    </div></ToastCtx.Provider>
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null), [err, setErr] = useState(''), [loading, setL] = useState(true)
  const run = useCallback(() => { setL(true); setErr(''); fn().then(setData).catch(e => setErr(e.message)).finally(() => setL(false)) }, deps) // eslint-disable-line
  useEffect(run, [run])
  return { data, err, loading, reload: run }
}
export const Empty = ({ children }: { children: ReactNode }) => <div className="card p-8 text-center text-sm text-mute">{children}</div>
export const ErrorBox = ({ msg, retry }: { msg: string; retry?: () => void }) => (
  <div className="card p-5 text-sm"><p className="text-bad">{msg}</p>{retry && <button className="btn-g mt-3" onClick={retry}>Coba lagi</button>}</div>)
