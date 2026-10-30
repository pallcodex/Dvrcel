import { handler, getToken, vercel, HttpError } from './_lib'

const map = (d: any) => ({ id: d.uid || d.id, name: d.name, url: d.url ? `https://${d.url}` : null,
  state: d.readyState || d.state, createdAt: d.createdAt || d.created,
  duration: d.ready ? d.ready - (d.buildingAt || d.createdAt || d.created) : null,
  inspectorUrl: d.inspectorUrl || null, error: d.errorMessage || null })

// GET ?id=... detail/status | GET list | POST {deploymentId,name} redeploy
export default handler(async (req) => {
  const token = getToken(req)
  if (req.method === 'POST') {
    const { deploymentId, name } = req.body || {}
    if (typeof deploymentId !== 'string' || typeof name !== 'string') throw new HttpError(400, 'deploymentId dan name wajib.')
    const d = await vercel(token, '/v13/deployments?forceNew=1', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, deploymentId, target: 'production' }) })
    return { deployment: map(d) }
  }
  const id = typeof req.query.id === 'string' ? req.query.id : ''
  if (id) {
    if (!/^[\w-]{5,80}$/.test(id)) throw new HttpError(400, 'ID tidak valid.')
    return { deployment: map(await vercel(token, `/v13/deployments/${id}`)) }
  }
  const d = await vercel(token, `/v6/deployments?limit=${Math.min(Number(req.query.limit) || 50, 100)}`)
  return { deployments: d.deployments.map(map) }
})
