# Dvrcel - Upload. Deploy. Go Live.

## Struktur
- `api/` Serverless Functions: `connect`, `projects`, `deploy`, `deployments`, `_lib` (sesi terenkripsi, rate limit, wrapper Vercel API)
- `src/pages` halaman, `src/components.tsx` UI bersama, `src/lib/api.ts` klien API + util

## Token Vercel
vercel.com > Account Settings > Tokens > Create Token (scope akun Anda). Tempel di halaman Deploy.

## Environment variable
`SESSION_SECRET` (min 32 karakter acak). Lihat `.env.example`.

## Lokal
`npm install`, buat `.env.local` dari `.env.example`, lalu `npx vercel dev` (menjalankan frontend + /api). `npm run dev` saja hanya frontend.

## Deploy Dvrcel
Push ke GitHub, Import di Vercel, tambahkan `SESSION_SECRET` di Project Settings > Environment Variables, Deploy.
