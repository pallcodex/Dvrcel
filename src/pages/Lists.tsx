import { useMemo, useState } from 'react'
import { Search, ExternalLink, RotateCw, Rocket, FolderGit2, History, BookOpen } from 'lucide-react'
import { api, Dep, Proj, Session, fmtTime, fmtDur, stateKind } from '../lib/api'
import { Badge, Empty, ErrorBox, Select, useAsync, useToast } from '../components'
import { useI18n } from '../lib/i18n'

const Loading = () => <div className="card h-24 animate-pulse" />
const useRedeploy = (reload: () => void) => { const toast = useToast(), { t } = useI18n(); return async (id: string, name: string) => {
  try { await api('deployments', { method: 'POST', body: { deploymentId: id, name } }); toast(t('p.redeployed')); setTimeout(reload, 1500) } catch (e: any) { toast(e.message, true) } } }

export function Dashboard({ go, session }: { go: (p: string) => void; session: Session }) {
  const { t } = useI18n()
  const { data, err, loading, reload } = useAsync(() => session.connected ? api<{ deployments: Dep[] }>('deployments?limit=100') : Promise.resolve({ deployments: [] }), [session.connected])
  const d = data?.deployments || [], k = (x: string) => d.filter(i => stateKind(i.state) === x).length
  const stats = [[t('dash.total'), d.length, t('dash.totalHint')], [t('dash.ok'), k('ready'), t('dash.okHint')], [t('dash.fail'), k('error'), t('dash.failHint')]] as const
  const qa = [['deploy', t('qa.new'), t('qa.newHint'), Rocket], ['projects', t('qa.projects'), t('qa.projectsHint'), FolderGit2], ['history', t('qa.history'), t('qa.historyHint'), History]] as const
  return <div className="page mx-auto max-w-4xl space-y-6">
    <div><h1 className="text-3xl font-bold sm:text-4xl">{t('dash.title')}</h1><p className="mt-2 text-mute">{t('dash.sub')}</p></div>
    {!session.connected && <div className="card p-4 text-sm text-mute">{t('dash.connectFirst')}</div>}
    {err ? <ErrorBox msg={err} retry={reload} /> : <div className="grid gap-3 sm:grid-cols-3">{stats.map(([l, v, h]) =>
      <div key={l} className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-mute">{l}</p><p className="disp mt-1 text-4xl">{loading ? '-' : v}</p><p className="mt-1 text-xs text-mute">{h}</p></div>)}</div>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {qa.map(([p, l, h, I]) => <button key={p} onClick={() => go(p)} className="card flex flex-col items-start gap-2 p-4 text-left hover:-translate-y-0.5 hover:border-acc"><I size={20} className="text-acc" /><span className="text-sm font-semibold">{l}</span><span className="text-xs text-mute">{h}</span></button>)}
      <a href="https://vercel.com/docs/rest-api" target="_blank" rel="noreferrer" className="card flex flex-col items-start gap-2 p-4 hover:-translate-y-0.5 hover:border-acc"><BookOpen size={20} className="text-acc" /><span className="text-sm font-semibold">{t('qa.docs')}</span><span className="text-xs text-mute">{t('qa.docsHint')}</span></a></div>
    <section><h2 className="font-semibold">{t('dash.recent')}</h2><p className="mb-3 mt-1 text-xs text-mute">{t('dash.recentHint')}</p>
      {loading ? <Loading /> : d.length === 0 && !err ? <Empty>{t('dash.empty')}</Empty> :
        <div className="card divide-y">{d.slice(0, 6).map(i => <div key={i.id} className="flex items-center justify-between gap-3 p-4 text-sm">
          <div className="min-w-0"><p className="truncate font-semibold">{i.name}</p><p className="text-xs text-mute">{fmtTime(i.createdAt)}</p></div><Badge state={i.state} /></div>)}</div>}</section></div>
}

export function Projects() {
  const { t } = useI18n(), { data, err, loading, reload } = useAsync(() => api<{ projects: Proj[] }>('projects'), [])
  const [q, setQ] = useState(''), [f, setF] = useState('all'), redeploy = useRedeploy(reload)
  const rows = useMemo(() => (data?.projects || []).filter(p => p.name.includes(q.toLowerCase()) && (f === 'all' || stateKind(p.state) === f)), [data, q, f])
  return <div className="page mx-auto max-w-4xl space-y-4"><div><h1 className="text-2xl font-bold">{t('p.title')}</h1><p className="mt-1 text-sm text-mute">{t('p.hint')}</p></div>
    <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3.5 text-mute" /><input className="inp !pl-9" placeholder={t('l.search')} value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="sm:w-48"><Select label={t('l.statusFilter')} value={f} onChange={setF} options={[['all', t('l.all')], ['ready', t('l.ready')], ['building', t('l.building')], ['error', t('l.error')]]} /></div></div>
    {err ? <ErrorBox msg={err} retry={reload} /> : loading ? <Loading /> : rows.length === 0 ? <Empty>{t('p.none')}</Empty> :
      <div className="space-y-3">{rows.map(p => <div key={p.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{p.name}</p><Badge state={p.state} /></div>
          <p className="mt-1 truncate text-xs text-mute">{p.url || t('p.noDep')}</p><p className="text-xs text-mute">{p.framework || 'Static / Other'} · {fmtTime(p.deployedAt)}</p></div>
        <div className="flex flex-wrap gap-2">{p.url && <a className="btn-g" href={p.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> {t('p.open')}</a>}
          {p.latestId && <button className="btn-g" onClick={() => redeploy(p.latestId!, p.name)}><RotateCw size={15} /> {t('p.redeploy')}</button>}
          <a className="btn-g" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">{t('p.details')}</a></div></div>)}</div>}</div>
}

export function HistoryPage() {
  const { t } = useI18n(), { data, err, loading, reload } = useAsync(() => api<{ deployments: Dep[] }>('deployments?limit=100'), [])
  const [f, setF] = useState('all'), [sel, setSel] = useState<Dep | null>(null), redeploy = useRedeploy(reload)
  const rows = (data?.deployments || []).filter(d => f === 'all' || stateKind(d.state) === f)
  return <div className="page mx-auto max-w-4xl space-y-4"><div><h1 className="text-2xl font-bold">{t('h.title')}</h1><p className="mt-1 text-sm text-mute">{t('h.hint')}</p></div>
    <div className="flex gap-2 overflow-x-auto">{[['all', t('l.allShort')], ['ready', t('l.ready')], ['building', t('l.building')], ['error', t('l.error')]].map(([v, l]) =>
      <button key={v} onClick={() => setF(v)} className={`btn ${f === v ? 'border-transparent bg-acc text-white' : 'bg-card'}`}>{l}</button>)}</div>
    {err ? <ErrorBox msg={err} retry={reload} /> : loading ? <Loading /> : rows.length === 0 ? <Empty>{t('h.none')}</Empty> :
      <div className="card divide-y">{rows.map(d => <button key={d.id} onClick={() => setSel(d)} className="flex w-full flex-col gap-1 p-4 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.04] sm:flex-row sm:items-center sm:gap-4">
        <span className="font-semibold sm:w-40 sm:truncate">{d.name}</span><span className="flex-1 truncate text-xs text-mute">{d.id}</span>
        <span className="text-xs text-mute">{fmtTime(d.createdAt)} · {fmtDur(d.duration)}</span><Badge state={d.state} /></button>)}</div>}
    {sel && <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={() => setSel(null)}>
      <div className="page card max-h-[90vh] w-full max-w-lg overflow-auto rounded-b-none p-5 sm:rounded-b-2xl" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h3 className="text-lg">{sel.name}</h3><Badge state={sel.state} /></div>
        <dl className="space-y-2 text-sm">{[[t('h.id'), sel.id], [t('h.url'), sel.url || '-'], [t('h.time'), fmtTime(sel.createdAt)], [t('h.dur'), fmtDur(sel.duration)], [t('h.err'), sel.error || '-']].map(([k, v]) =>
          <div key={k}><dt className="text-xs text-mute">{k}</dt><dd className="break-all">{v}</dd></div>)}</dl>
        <div className="mt-4 flex flex-wrap gap-2">{sel.url && <a className="btn-g" href={sel.url} target="_blank" rel="noreferrer">{t('p.open')}</a>}
          {sel.inspectorUrl && <a className="btn-g" href={sel.inspectorUrl} target="_blank" rel="noreferrer">{t('h.inspect')}</a>}
          <button className="btn-p" onClick={() => { redeploy(sel.id, sel.name); setSel(null) }}><RotateCw size={15} /> {t('p.redeploy')}</button>
          <button className="btn-g" onClick={() => setSel(null)}>{t('h.close')}</button></div></div></div>}</div>
}
