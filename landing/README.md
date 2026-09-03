# FA Studio — Landing (Vercel)

Static marketing site. Ops / login / booking tetap di Google Apps Script.

## Customize dari repo

1. Edit sumber di root: `PageHome.html`, `PartialsNav.html`, `PartialsLgFooter.html`, CSS landing di `Styles.html`, logika di `ScriptsCore.html` (blok `LG_*`).
2. Jalankan: `python3 tools/build-landing.py`
3. Set URL GAS di `landing/config.js` (`GAS_APP_URL`).
4. Deploy folder `landing/` ke Vercel (Root Directory = `landing`).

## Deploy Vercel

1. Import repo ke Vercel.
2. **Root Directory:** `landing`
3. Framework: Other — no build command.
4. Tambahkan custom domain `fastudio.id`.

CTA **Create Project** / **Sign In** mengarah ke `GAS_APP_URL`.
