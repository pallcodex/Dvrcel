import { useMemo, useState } from 'react'
import { Search, ExternalLink, RotateCw, Rocket, FolderGit2, History, BookOpen } from 'lucide-react'
import { api, Dep, Proj, fmtTime, fmtDur, stateKind } from '../lib/api'
import { Badge, Empty, ErrorBox, useAsync, useToast } from '../components'

const Loading = () => <div className="card h-24 animate-pulse" />
const useRedeploy = (reload: () => void) => { const toast = useToast(); return async (id: string, name: string) => {
  try { await api('deployments', { method: 'POST', body: { deploymentId: id, name } }); toast('Redeploy dimulai.'); setTimeout(reload, 1500) } catch (e: any) { toast(e.message, true) } } }

export function Dashboard({ go }: { go: (p: string) => void }) {
  const { data, err, loading, reload } = useAsync(() => api<{ deployments: Dep[] }>('deployments?limit=100'), [])
  const d = data?.deployments || [], k = (x: string) => d.filter(i => stateKind(i.state) === x).length
  const stats = [['Total deployments', d.length], ['Successful', k('ready')], ['Failed', k('error')]]
  const qa = [['deploy', 'New Deployment', Rocket], ['projects', 'View Projects', FolderGit2], ['history', 'Deployment History', History]] as const
  return <div className="page mx-auto max-w-4xl space-y-6">
    <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Deploy your website.</h1><p className="mt-2 text-mute">Publish your website in just a few clicks.</p></div>
    {err ? <ErrorBox msg={err} retry={reload} /> : <div className="grid gap-3 sm:grid-cols-3">{stats.map(([l, v]) =>
      <div key={l} className="card p-4"><p className="text-xs font-semibold uppercase tracking-wide text-mute">{l}</p><p className="mt-1 text-3xl font-bold">{loading ? '-' : v}</p></div>)}</div>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {qa.map(([p, l, I]) => <button key={p} onClick={() => go(p)} className="card flex flex-col items-start gap-3 p-4 text-left text-sm font-semibold hover:-translate-y-0.5 hover:border-acc"><I size={20} className="text-acc" />{l}</button>)}
      <a href="https://vercel.com/docs/rest-api" target="_blank" rel="noreferrer" className="card flex flex-col items-start gap-3 p-4 text-sm font-semibold hover:-translate-y-0.5 hover:border-acc"><BookOpen size={20} className="text-acc" />Documentation</a></div>
    <section><h2 className="mb-3 font-semibold">Recent activity</h2>
      {loading ? <Loading /> : d.length === 0 && !err ? <Empty>Belum ada aktivitas. Hubungkan token Vercel dan buat deployment pertama Anda.</Empty> :
        <div className="card divide-y">{d.slice(0, 6).map(i => <div key={i.id} className="flex items-center justify-between gap-3 p-4 text-sm">
          <div className="min-w-0"><p className="truncate font-semibold">{i.name}</p><p className="text-xs text-mute">{fmtTime(i.createdAt)}</p></div><Badge state={i.state} /></div>)}</div>}</section></div>
}

export function Projects() {
  const { data, err, loading, reload } = useAsync(() => api<{ projects: Proj[] }>('projects'), [])
  const [q, setQ] = useState(''), [f, setF] = useState('all'), redeploy = useRedeploy(reload)
  const rows = useMemo(() => (data?.projects || []).filter(p => p.name.includes(q.toLowerCase()) && (f === 'all' || stateKind(p.state) === f)), [data, q, f])
  return <div className="page mx-auto max-w-4xl space-y-4"><h1 className="text-2xl font-bold">Projects</h1>
    <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3.5 text-mute" /><input className="inp !pl-9" placeholder="Cari project" value={q} onChange={e => setQ(e.target.value)} /></div>
      <select className="inp sm:w-44" value={f} onChange={e => setF(e.target.value)}><option value="all">Semua status</option><option value="ready">Ready</option><option value="building">Building</option><option value="error">Error</option></select></div>
    {err ? <ErrorBox msg={err} retry={reload} /> : loading ? <Loading /> : rows.length === 0 ? <Empty>Tidak ada project yang cocok.</Empty> :
      <div className="space-y-3">{rows.map(p => <div key={p.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{p.name}</p><Badge state={p.state} /></div>
          <p className="mt-1 truncate text-xs text-mute">{p.url || 'Belum ada deployment'}</p><p className="text-xs text-mute">{p.framework || 'Static / Other'} · {fmtTime(p.deployedAt)}</p></div>
        <div className="flex gap-2">{p.url && <a className="btn-g" href={p.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open</a>}
          {p.latestId && <button className="btn-g" onClick={() => redeploy(p.latestId!, p.name)}><RotateCw size={15} /> Redeploy</button>}
          <a className="btn-g" href={`https://vercel.com/dashboard`} target="_blank" rel="noreferrer">Details</a></div></div>)}</div>}</div>
}

export function HistoryPage() {
  const { data, err, loading, reload } = useAsync(() => api<{ deployments: Dep[] }>('deployments?limit=100'), [])
  const [f, setF] = useState('all'), [sel, setSel] = useState<Dep | null>(null), redeploy = useRedeploy(reload)
  const rows = (data?.deployments || []).filter(d => f === 'all' || stateKind(d.state) === f)
  return <div className="page mx-auto max-w-4xl space-y-4"><h1 className="text-2xl font-bold">Deployment History</h1>
    <div className="flex gap-2 overflow-x-auto">{[['all', 'All'], ['ready', 'Ready'], ['building', 'Building'], ['error', 'Error']].map(([v, l]) =>
      <button key={v} onClick={() => setF(v)} className={`btn ${f === v ? 'bg-acc text-white border-transparent' : 'bg-card'}`}>{l}</button>)}</div>
    {err ? <ErrorBox msg={err} retry={reload} /> : loading ? <Loading /> : rows.length === 0 ? <Empty>Tidak ada deployment.</Empty> :
      <div className="card divide-y">{rows.map(d => <button key={d.id} onClick={() => setSel(d)} className="flex w-full flex-col gap-1 p-4 text-left text-sm hover:bg-black/[.03] dark:hover:bg-white/[.04] sm:flex-row sm:items-center sm:gap-4">
        <span className="font-semibold sm:w-40 sm:truncate">{d.name}</span><span className="flex-1 truncate text-xs text-mute">{d.id}</span>
        <span className="text-xs text-mute">{fmtTime(d.createdAt)} · {fmtDur(d.duration)}</span><Badge state={d.state} /></button>)}</div>}
    {sel && <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => setSel(null)}>
      <div className="page card max-h-[90vh] w-full max-w-lg overflow-auto rounded-b-none p-5 sm:rounded-b-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{sel.name}</h3><Badge state={sel.state} /></div>
        <dl className="space-y-2 text-sm">{[['Deployment ID', sel.id], ['URL', sel.url || '-'], ['Waktu', fmtTime(sel.createdAt)], ['Durasi', fmtDur(sel.duration)], ['Error', sel.error || '-']].map(([k, v]) =>
          <div key={k}><dt className="text-xs text-mute">{k}</dt><dd className="break-all">{v}</dd></div>)}</dl>
        <div className="mt-4 flex flex-wrap gap-2">{sel.url && <a className="btn-g" href={sel.url} target="_blank" rel="noreferrer">Open</a>}
          {sel.inspectorUrl && <a className="btn-g" href={sel.inspectorUrl} target="_blank" rel="noreferrer">Inspect</a>}
          <button className="btn-p" onClick={() => { redeploy(sel.id, sel.name); setSel(null) }}><RotateCw size={15} /> Redeploy</button>
          <button className="btn-g" onClick={() => setSel(null)}>Tutup</button></div></div></div>}</div>
}
