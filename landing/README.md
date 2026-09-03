# FA Studio — Public site + login gate (Vercel)

## Architecture

| Zone | Host | Isi |
|------|------|-----|
| Marketing | Vercel (`fastudio.id`) | Home, Work, Services, About |
| Login gate | Vercel (`/signin`) | Halaman login di domain FA Studio |
| System | GAS (di balik gate) | Sign In/Up, client portal, internal ops / bispro |

Setelah lewat gate login, seluruh dashboard client dan internal system di-handle GAS.
URL browser tetap di `fastudio.id/signin` (shell Vercel + iframe GAS).

## Customize dari repo

1. Edit sumber marketing di root: `PageHome.html`, `PageGallery.html`, `PageAbout.html`,
   `PartialsNav.html`, `PartialsMobileNav.html`, `PartialsLgFooter.html`,
   `PartialsAboutFaq.html`, CSS di `Styles.html`, logika publik di `ScriptsCore.html`.
2. Auth/ops tetap di GAS: `IndexAuth.html`, `PageOps.html`, `ScriptsOps.html`, `Kode.js`, …
3. Jalankan: `python3 tools/build-landing.py`
4. Set `GAS_APP_URL` di `landing/config.js`.
5. Deploy folder `landing/` ke Vercel (Root Directory = `landing`).

## Routes

| Path | Isi |
|------|-----|
| `/` | Home · Work · Services · About (+ mobile nav) |
| `/signin` | **Login gate** → GAS auth + post-login system |
| `/signin?page=reset-password` | Reset password (masih di gate) |
| `/app`, `/ops`, `/booking` | Alias → `/signin` |

## Deploy

1. Vercel Root Directory = `landing`
2. Custom domain `fastudio.id`
3. GAS `doGet` harus `XFrameOptionsMode.ALLOWALL`
4. Setelah ubah auth shell (`IndexAuth`), `clasp push` (+ deploy web app bila perlu)
