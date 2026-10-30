import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { Sun, Moon, X, ChevronDown, Check, Languages } from 'lucide-react'
import { useI18n } from './lib/i18n'
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
export const ThemeToggle = ({ t }: { t: ReturnType<typeof useTheme> }) => { const { t: tr } = useI18n(); return (
  <button className="btn-g !px-0 w-11" onClick={t.toggle} aria-label={tr('theme')}>{t.dark ? <Sun size={18} /> : <Moon size={18} />}</button>) }
export const LangToggle = () => { const { lang, setLang, t } = useI18n(); return (
  <button className="btn-g gap-1.5 !px-3" onClick={() => setLang(lang === 'id' ? 'en' : 'id')} aria-label={t('lang')}><Languages size={16} /><span className="text-xs font-bold uppercase">{lang}</span></button>) }

// UI pilihan buatan sendiri (pengganti dropdown/action sheet bawaan browser)
export function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: [string, string][]; label: string }) {
  const [open, setOpen] = useState(false), cur = options.find(o => o[0] === value)
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [open])
  return <>
    <button type="button" className="inp flex items-center justify-between gap-2 text-left" onClick={() => setOpen(true)} aria-haspopup="listbox" aria-expanded={open}>
      <span className="truncate">{cur?.[1]}</span><ChevronDown size={16} className="shrink-0 text-mute" /></button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
      <div role="listbox" aria-label={label} className="page card max-h-[70vh] w-full max-w-sm overflow-auto rounded-b-none p-2 sm:rounded-b-2xl"
        style={{ paddingBottom: 'max(.5rem, env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-mute">{label}</p>
        {options.map(([v, l]) => <button key={v} role="option" aria-selected={v === value} onClick={() => { onChange(v); setOpen(false) }}
          className="flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 text-left text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5">
          <span>{l}</span>{v === value && <Check size={16} className="text-acc" />}</button>)}
      </div></div>}
  </>
}

export const Badge = ({ state }: { state?: string | null }) => {
  const k = stateKind(state), c = k === 'ready' ? 'text-ok' : k === 'error' ? 'text-bad' : 'text-acc'
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c}`}>
    <span className={`h-1.5 w-1.5 rounded-full bg-current ${k === 'building' ? 'animate-pulse' : ''}`} />{state || '-'}</span>
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
export const ErrorBox = ({ msg, retry }: { msg: string; retry?: () => void }) => { const { t } = useI18n(); return (
  <div className="card p-5 text-sm"><p className="text-bad">{msg}</p>{retry && <button className="btn-g mt-3" onClick={retry}>{t('retry')}</button>}</div>) }
