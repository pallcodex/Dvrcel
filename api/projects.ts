import { handler, getToken, vercel } from './_lib'

export default handler(async (req) => {
  const d = await vercel(getToken(req), '/v9/projects?limit=100')
  return { projects: d.projects.map((p: any) => {
    const l = p.latestDeployments?.[0]
    return { id: p.id, name: p.name, framework: p.framework, url: l?.url ? `https://${l.url}` : null,
      state: l?.readyState || null, deployedAt: l?.createdAt || null, latestId: l?.id || null }
  }) }
})
