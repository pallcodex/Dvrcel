import { useRef, useState } from 'react'
import { UploadCloud, X, Copy, ExternalLink, RotateCw, CheckCircle2, AlertCircle, Image as Img } from 'lucide-react'
import { api, fmtSize, toB64, Dep, Session } from '../lib/api'
import { useToast, Select } from '../components'
import { useI18n } from '../lib/i18n'
import Connect from './Connect'

const MAX = 3 * 1024 * 1024
const FW = [['vite', 'Vite'], ['nextjs', 'Next.js'], ['create-react-app', 'Create React App'], ['astro', 'Astro'], ['svelte', 'Svelte'], ['vue', 'Vue']]
const stepOf = (s: string) => s === 'QUEUED' ? 2 : s === 'INITIALIZING' ? 3 : s === 'BUILDING' ? 3 : s === 'READY' ? 5 : 4
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export default function Deploy({ session, setSession }: { session: Session; setSession: (s: Session) => void }) {
  const [files, setFiles] = useState<File[]>([]), [fav, setFav] = useState<File | null>(null), [drag, setDrag] = useState(false)
  const [cfg, setCfg] = useState({ projectName: '', framework: 'static', rootDirectory: '', buildCommand: '', outputDirectory: '' })
  const [step, setStep] = useState(-1), [dep, setDep] = useState<Dep | null>(null), [error, setError] = useState('')
  const toast = useToast(), { t } = useI18n(), STEPS = [0, 1, 2, 3, 4, 5].map(i => t(`s${i}` as 's0')), fwOpts: [string, string][] = [['static', t('d.fwStatic')], ...(FW as string[][]).map(x => [x[0], x[1]] as [string, string])], ref = useRef<HTMLInputElement>(null), total = files.reduce((s, f) => s + f.size, 0) + (fav?.size || 0)
  const busy = step >= 0 && step < 5 && !error, st = cfg.framework === 'static'

  const add = (list: FileList | null) => { if (list) setFiles(f => [...f, ...Array.from(list)]) }
  const nameOk = /^[a-z0-9][a-z0-9._-]{0,99}$/.test(cfg.projectName) && !cfg.projectName.includes('---')

  async function go() {
    setError(''); setDep(null)
    if (!session.connected) return toast(t('d.needConn'), true)
    if (!nameOk) return toast(t('d.needName'), true)
    if (!files.length) return toast(t('d.needFiles'), true)
    if (total > MAX) return toast(t('d.tooBig', { n: fmtSize(MAX) }), true)
    try {
      setStep(0)
      const enc = await Promise.all(files.map(async f => ({ name: f.name, data: await toB64(f) })))
      const favicon = fav ? { name: fav.name, data: await toB64(fav) } : undefined
      setStep(1)
      const r = await api<{ deployment: Dep }>('deploy', { method: 'POST', body: { ...cfg, files: enc, favicon } })
      setDep(r.deployment); setStep(2)
      for (let i = 0; i < 120; i++) { // polling status asli dari Vercel
        const d = (await api<{ deployment: Dep }>('deployments?id=' + r.deployment.id)).deployment
        setDep(d); setStep(stepOf(d.state))
        if (d.state === 'READY') return toast(t('d.done'))
        if (d.state === 'ERROR' || d.state === 'CANCELED') { setError(d.error || t('d.buildFail')); return }
        await sleep(2500)
      }
      setError(t('d.timeout'))
    } catch (e: any) { setError(e.message); toast(e.message, true) }
  }
  const reset = () => { setStep(-1); setDep(null); setError('') }

  return (
    <div className="page mx-auto max-w-3xl space-y-5">
      <div><h1 className="text-2xl font-bold">{t('d.title')}</h1><p className="mt-1 text-sm text-mute">{t('d.intro')}</p></div>
      <Connect session={session} setSession={setSession} />

      <section className="card p-5">
        <h2 className="font-semibold">{t('d.upTitle')}</h2><p className="mb-3 mt-1 text-sm text-mute">{t('d.upHint')}</p>
        <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files) }}
          onClick={() => ref.current?.click()} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && ref.current?.click()}
          className={`flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center t ${drag ? 'border-acc bg-acc/5' : ''}`}>
          <UploadCloud className={drag ? 'text-acc' : 'text-mute'} size={30} />
          <p className="text-sm font-medium">{t('d.drop')}</p>
          <p className="text-xs text-mute">{t('d.limit', { n: fmtSize(MAX) })}</p>
          <input ref={ref} type="file" multiple hidden onChange={e => { add(e.target.files); e.target.value = '' }} />
        </div>
        {files.length > 0 && <ul className="mt-3 divide-y rounded-xl border">
          {files.map((f, i) => <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{f.name}</span><span className="text-xs text-mute">{fmtSize(f.size)}</span>
            <button className="p-2" aria-label={t('d.remove')} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X size={16} /></button></li>)}
          <li className="px-3 py-2 text-xs text-mute">{t('d.count', { n: files.length, s: fmtSize(total) })}</li></ul>}
      </section>

      <section className="card space-y-4 p-5">
        <div><h2 className="font-semibold">{t('d.cfg')}</h2><p className="mt-1 text-sm text-mute">{t('d.cfgHint')}</p></div>
        <div><label className="lbl" htmlFor="pn">{t('d.name')}</label>
          <input id="pn" className="inp" value={cfg.projectName} onChange={e => setCfg({ ...cfg, projectName: e.target.value.toLowerCase() })} placeholder="my-site" />
          <p className="mt-1 text-xs text-mute">{t('d.nameHint')}</p>
          {cfg.projectName && !nameOk && <p className="mt-1 text-xs text-bad">{t('d.nameBad')}</p>}</div>
        <div><label className="lbl" htmlFor="fw">{t('d.fw')}</label>
          <Select label={t('d.fw')} value={cfg.framework} options={fwOpts} onChange={v => setCfg({ ...cfg, framework: v })} /><p className="mt-1 text-xs text-mute">{t('d.fwHint')}</p></div>
        {!st && <div className="grid gap-4 sm:grid-cols-3">
          {([['rootDirectory', t('d.root'), ''], ['buildCommand', t('d.build'), 'npm run build'], ['outputDirectory', t('d.out'), 'dist']] as const).map(([k, l, p]) =>
            <div key={k}><label className="lbl">{l}</label><input className="inp" value={cfg[k]} placeholder={p} onChange={e => setCfg({ ...cfg, [k]: e.target.value })} /></div>)}</div>}
        {st && <p className="text-xs text-mute">{t('d.staticNote')}</p>}
        <div><label className="lbl">{t('d.favTitle')}</label>
          <div className="flex items-center gap-3">
            {fav ? <><img src={URL.createObjectURL(fav)} alt={t('d.favPrev')} className="h-10 w-10 rounded-lg border object-contain p-1" />
              <span className="min-w-0 flex-1 truncate text-sm">{fav.name}</span><button className="p-2" onClick={() => setFav(null)} aria-label={t('d.favRemove')}><X size={16} /></button></>
              : <label className="btn-g cursor-pointer"><Img size={16} /> {t('d.favPick')}<input type="file" hidden accept=".png,.ico,.svg,image/png,image/x-icon,image/svg+xml"
                onChange={e => { const f = e.target.files?.[0]; if (f && /\.(png|ico|svg)$/i.test(f.name)) setFav(f); else if (f) toast(t('d.favBad'), true) }} /></label>}
          </div>
          {fav && <p className="mt-1 text-xs text-mute">{t('d.favHint')}</p>}</div>
      </section>

      {step >= 0 && <section className="card p-5" aria-live="polite">
        <h2 className="font-semibold">{t('d.status')}</h2><p className="mb-4 mt-1 text-xs text-mute">{t('d.statusHint')}</p>
        <ol className="space-y-2.5">{STEPS.map((s, i) => { const done = i < step || (step === 5 && i === 5), cur = i === step && !error && step < 5
          return <li key={s} className={`flex items-center gap-3 text-sm ${done || cur ? '' : 'text-mute'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${done ? 'border-ok text-ok' : cur ? 'border-acc text-acc' : ''}`}>{done ? <CheckCircle2 size={14} /> : i + 1}</span>
            <span className="flex-1">{s}</span>{cur && <span className="relative h-1 w-16 overflow-hidden rounded bg-acc/30"><span className="bar absolute inset-0 bg-acc" /></span>}</li> })}
          {error && <li className="flex items-start gap-3 text-sm text-bad"><AlertCircle size={20} className="shrink-0" /><span>{t('d.failed')}: {error}</span></li>}</ol>
        {error && <button className="btn-p mt-4" onClick={go}><RotateCw size={16} /> {t('d.retry')}</button>}
        {step === 5 && dep?.url && <div className="mt-5 space-y-3 rounded-xl border p-4">
          <a className="block break-all font-semibold text-acc" href={dep.url} target="_blank" rel="noreferrer">{dep.url}</a>
          <div className="flex flex-wrap gap-2">
            <a className="btn-p" href={dep.url} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {t('d.visit')}</a>
            <button className="btn-g" onClick={() => navigator.clipboard.writeText(dep.url!).then(() => toast(t('d.copied')))}><Copy size={16} /> {t('d.copy')}</button>
            {dep.inspectorUrl && <a className="btn-g" href={dep.inspectorUrl} target="_blank" rel="noreferrer">{t('d.view')}</a>}
            <button className="btn-g" onClick={reset}>{t('d.again')}</button></div></div>}
      </section>}

      <button className="btn-p w-full !min-h-[52px] text-base" disabled={busy} onClick={go}><UploadCloud size={18} /> {busy ? t('d.running') : t('d.go')}</button>
    </div>)
}
