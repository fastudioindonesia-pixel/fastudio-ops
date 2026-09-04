#!/usr/bin/env python3
"""Assemble the Vercel public site + login gate for FA Studio.

Architecture (locked):
  Vercel  → Home, Work, Services, About, and the Login gate URL (/user)
  GAS     → everything after the login gate: Sign In/Up UI, client portal,
            and the full internal ops system (dashboard, billing, production, …)

The login page is served from Vercel (`/user`) so the address bar stays on
fastudio.id. Behind that URL, a same-origin shell embeds the GAS auth/ops app
(iframe). Marketing pages never load GAS.

Usage (from repo root):
  python3 tools/build-landing.py
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "landing"
ASSETS_SRC = ROOT / "assets"
ASSETS_OUT = OUT / "assets"

INCLUDE_RE = re.compile(r"<\?!=\s*include\(\s*[\"']([^\"']+)[\"']\s*\)\s*;?\s*\?>")


def strip_style_wrapper(text: str) -> str:
    text = text.strip()
    m = re.match(r"^<style[^>]*>(.*)</style>\s*$", text, flags=re.I | re.S)
    return m.group(1).strip() + "\n" if m else text


def resolve_includes(html: str) -> str:
    """Expand <?!= include('Name') ?> from root HTML partials; drop unknown includes."""

    def repl(match: re.Match[str]) -> str:
        name = match.group(1)
        path = ROOT / f"{name}.html"
        if not path.exists():
            return ""
        return resolve_includes(path.read_text(encoding="utf-8"))

    return INCLUDE_RE.sub(repl, html)


def inject_footer_if_missing(html: str, footer: str) -> str:
    if "lg-footer" in html:
        return html
    html = html.rstrip()
    replaced = re.sub(
        r"(</div>\s*</div>\s*)$",
        footer + r"\n\1",
        html,
        count=1,
    )
    if replaced != html:
        return replaced
    return html + "\n" + footer + "\n"


def extract_scripts_core_landing(raw: str) -> str:
    """Pull public-site JS from ScriptsCore (landing + gallery + about; no ops)."""
    lines = raw.splitlines()
    if lines and lines[0].strip().lower().startswith("<script"):
        lines = lines[1:]
    if lines and lines[-1].strip().lower().startswith("</script"):
        lines = lines[:-1]

    chunks: list[str] = []
    chunks.append("var FA_STUDIO_SINCE_YEAR_ = 2021;\n")

    # Home landing: LG_SERVICES … before GALLERY_*
    start = next(i for i, l in enumerate(lines) if l.startswith("var LG_SERVICES = ["))
    gallery_start = next(
        i for i, l in enumerate(lines) if l.startswith("var GALLERY_CATEGORIES = [")
    )
    chunks.append("\n".join(lines[start:gallery_start]).rstrip() + "\n")

    # Gallery + mobile rail + about (through initFaqAccordion), stop before auth/ops
    auth_start = next(
        i for i, l in enumerate(lines) if l.startswith("function isAuthenticatedSession")
    )
    chunks.append("\n".join(lines[gallery_start:auth_start]).rstrip() + "\n")
    return "\n".join(chunks)


def build_index() -> str:
    nav = (ROOT / "PartialsNav.html").read_text(encoding="utf-8")
    mobile = (ROOT / "PartialsMobileNav.html").read_text(encoding="utf-8")
    footer = (ROOT / "PartialsLgFooter.html").read_text(encoding="utf-8")

    home = resolve_includes((ROOT / "PageHome.html").read_text(encoding="utf-8"))
    home = inject_footer_if_missing(home, footer)

    gallery = resolve_includes((ROOT / "PageGallery.html").read_text(encoding="utf-8"))
    # Gallery page should not start active
    gallery = gallery.replace('class="page lg-work-page"', 'class="page lg-work-page"', 1)
    if 'class="page active' in gallery:
        gallery = gallery.replace("page active", "page", 1)

    about = resolve_includes((ROOT / "PageAbout.html").read_text(encoding="utf-8"))

    return f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>FA Studio Indonesia</title>
<meta name="description" content="FA Studio Indonesia — Yours Unlimited Creativity. Film, photo, and 3D production."/>
<link rel="icon" href="assets/fa-app-icon.png" type="image/png" sizes="512x512"/>
<link rel="apple-touch-icon" href="assets/fa-app-icon.png" sizes="180x180"/>
<link rel="preconnect" href="https://script.google.com" crossorigin/>
<link rel="dns-prefetch" href="https://script.google.com"/>
<link rel="prefetch" href="/user"/>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600;1,700;1,800&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="styles.css"/>
<script>
(function () {{
  try {{ localStorage.removeItem('fa-theme'); }} catch (e) {{}}
  document.documentElement.removeAttribute('data-theme');
}})();
</script>
</head>
<body class="public-site">
{nav}
{home}
{gallery}
{about}
{mobile}
<script src="config.js"></script>
<script src="logos.js"></script>
<script src="landing.js"></script>
</body>
</html>
"""


def get_gas_exec_url() -> str:
    cfg = OUT / "config.js"
    if not cfg.exists():
        return ""
    m = re.search(r"GAS_APP_URL\s*=\s*['\"]([^'\"]+)['\"]", cfg.read_text(encoding="utf-8"))
    if not m:
        return ""
    url = m.group(1).strip().rstrip("/")
    if not url or "PASTE_" in url:
        return ""
    return url


def build_app_html() -> str:
    """Vercel login gate: branded shell + GAS iframe for auth + post-login system."""
    gas = get_gas_exec_url()
    default_src = f"{gas}?page=ops" if gas else ""
    preload = (
        f'<link rel="preload" as="document" href="{default_src}"/>\n'
        if default_src
        else ""
    )
    iframe_src = f' src="{default_src}"' if default_src else ""
    return """<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Sign In - FA Studio Indonesia</title>
<meta name="description" content="Sign in to FA Studio Indonesia. Login gate for client portal and internal ops."/>
<link rel="icon" href="assets/fa-app-icon.png" type="image/png" sizes="512x512"/>
<link rel="apple-touch-icon" href="assets/fa-app-icon.png" sizes="180x180"/>
<link rel="preconnect" href="https://script.google.com" crossorigin/>
<link rel="dns-prefetch" href="https://script.google.com"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
__PRELOAD__
<script src="config.js"></script>
<style>
  html, body { margin: 0; height: 100%; background: #f8f8f6; }
  body {
    font-family: system-ui, sans-serif;
    color: #070707;
    overflow: hidden;
  }
  #fa-app-boot {
    position: fixed; inset: 0; z-index: 2;
    display: flex; align-items: center; justify-content: center;
    background:
      radial-gradient(circle at 78% 18%,rgba(255,255,255,.98),transparent 22%),
      radial-gradient(circle at 12% 82%,rgba(255,255,255,.85),transparent 30%),
      linear-gradient(135deg,#f8f8f6 0%,#e8e8e3 52%,#f5f5f2 100%);
    transition: opacity .22s ease, visibility .22s ease;
  }
  #fa-app-boot.is-done { opacity: 0; visibility: hidden; pointer-events: none; }
  .fa-app-spin {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid rgba(7,7,7,.12); border-top-color: #070707;
    animation: faAppSpin .7s linear infinite;
  }
  @keyframes faAppSpin { to { transform: rotate(360deg); } }
  #fa-app-frame {
    position: fixed; inset: 0; width: 100%; height: 100%;
    border: 0; background: #f8f8f6; z-index: 1;
  }
  #fa-app-fallback {
    display: none; position: fixed; inset: 0; z-index: 3;
    align-items: center; justify-content: center;
    background: #f8f8f6; padding: 24px; text-align: center;
  }
  #fa-app-fallback.is-on { display: flex; }
  #fa-app-fallback a {
    color: #070707; font-weight: 600;
  }
</style>
</head>
<body>
  <div id="fa-app-boot" role="status" aria-live="polite" aria-label="Memuat Sign In">
    <div class="fa-app-spin" aria-hidden="true"></div>
  </div>
  <iframe
    id="fa-app-frame"
    title="FA Studio Sign In"
    allow="clipboard-write"
    referrerpolicy="no-referrer-when-downgrade"
    fetchpriority="high"
    __IFRAME_SRC__
  ></iframe>
  <div id="fa-app-fallback">
    <div>
      <p>Login gate belum bisa dimuat di halaman ini.</p>
      <p><a id="fa-app-fallback-link" href="#">Buka langsung</a> · <a href="/">Kembali ke beranda</a></p>
    </div>
  </div>
  <script>
(function () {
  var boot = document.getElementById('fa-app-boot');
  var frame = document.getElementById('fa-app-frame');
  var fallback = document.getElementById('fa-app-fallback');
  var fallbackLink = document.getElementById('fa-app-fallback-link');
  var params = new URLSearchParams(window.location.search || '');
  var page = String(params.get('page') || 'ops').trim().toLowerCase();
  if (page === 'faq-contact') page = 'about';
  if (page === 'booking' || page === 'login' || page === 'signin' || page === 'user' || page === 'create') page = 'ops';
  if (page !== 'ops' && page !== 'reset-password') page = 'ops';

  var base = String(window.GAS_APP_URL || '').replace(/\\/$/, '');
  if (!base || base.indexOf('PASTE_') === 0) {
    if (boot) boot.classList.add('is-done');
    if (fallback) fallback.classList.add('is-on');
    return;
  }

  var gasUrl = base + '?page=' + encodeURIComponent(page);
  if (fallbackLink) fallbackLink.href = gasUrl;

  var host = String(window.location.hostname || '');
  var isLocalHost = host === '127.0.0.1' || host === 'localhost';
  if (isLocalHost) {
    window.location.replace(gasUrl);
    return;
  }

  var done = false;
  function hideBoot() {
    if (done) return;
    done = true;
    if (boot) boot.classList.add('is-done');
  }

  if (frame) {
    var current = String(frame.getAttribute('src') || '');
    if (current !== gasUrl) frame.src = gasUrl;
    frame.addEventListener('load', hideBoot);
  }
  window.setTimeout(hideBoot, 400);
  window.setTimeout(function () {
    if (!done && fallback) fallback.classList.add('is-on');
  }, 20000);

  try {
    document.title = (page === 'reset-password' ? 'Reset Password' : 'Sign In') + ' - FA Studio Indonesia';
  } catch (e) {}

  // GAS nested iframe → postMessage ke window.top; terima judul dari allowlist.
  var FA_TITLES = {
    'Portal Client - FA Studio Indonesia': 1,
    'Operation System - FA Studio Indonesia': 1,
    'Production - FA Studio Indonesia': 1,
    'Sign In - FA Studio Indonesia': 1,
    'Reset Password - FA Studio Indonesia': 1
  };
  window.addEventListener('message', function (ev) {
    try {
      var data = ev.data;
      if (!data || data.type !== 'fa-studio-title' || typeof data.title !== 'string') return;
      var next = String(data.title || '').trim();
      if (!FA_TITLES[next]) return;
      document.title = next;
    } catch (err) {}
  });
})();
  </script>
</body>
</html>
""".replace("__PRELOAD__", preload).replace("__IFRAME_SRC__", iframe_src)


def build_bridge_js() -> str:
    return r"""
/* Bridge:
 * Vercel = Home / Work / Services / About (marketing)
 * /user = login gate on Vercel → GAS handles Sign In + client portal + internal ops
 */
function gasAppUrl_(page) {
  var base = (window.GAS_APP_URL || '').replace(/\/$/, '');
  if (!base || base.indexOf('PASTE_') === 0) {
    console.warn('[landing] Set GAS_APP_URL in landing/config.js to your Apps Script /exec URL.');
    return '';
  }
  if (!page || page === 'home') return base;
  return base + '?page=' + encodeURIComponent(page);
}

/** Canonical login gate on Vercel. Aliases /signin /app /ops /booking also work. */
function localSignInPath_(page) {
  var p = String(page || 'ops').trim().toLowerCase();
  if (p === 'booking' || p === 'login' || p === 'signin' || p === 'user' || p === 'create') p = 'ops';
  if (p !== 'ops' && p !== 'reset-password') p = 'ops';
  if (p === 'ops') return '/user';
  return '/user?page=' + encodeURIComponent(p);
}

function warmGasApp_() {
  var base = (window.GAS_APP_URL || '').replace(/\/$/, '');
  if (!base || base.indexOf('PASTE_') === 0) return;
  var warm = base + (base.indexOf('?') >= 0 ? '&' : '?') + 'warm=1';
  try {
    fetch(warm, { mode: 'no-cors', credentials: 'omit', keepalive: true });
  } catch (e1) {}
  try {
    fetch('/user', { credentials: 'omit', cache: 'force-cache', keepalive: true });
  } catch (e3) {}
}

function goToGasApp(page) {
  if (!gasAppUrl_(page || 'ops')) {
    alert('URL aplikasi belum di-set. Isi GAS_APP_URL di landing/config.js, lalu rebuild/deploy ulang.');
    return;
  }
  // Don't ping GAS on click — navigation would race the iframe. Homepage idle/hover already warmed it.
  window.location.href = localSignInPath_(page || 'ops');
}

function getActivePageId() {
  var gallery = document.getElementById('gallery');
  if (gallery && gallery.classList.contains('active')) return 'gallery';
  var about = document.getElementById('about');
  if (about && about.classList.contains('active')) return 'about';
  var home = document.getElementById('home');
  if (home && home.classList.contains('active')) return 'home';
  var page = document.querySelector('.page.active');
  return page ? page.id : 'home';
}

function goPublicHome() {
  setPage('home');
}

function openStartProject() {
  goToGasApp('ops');
}

function setPage(page) {
  if (page === 'faq-contact') page = 'about';
  if (page === 'booking' || page === 'ops' || page === 'reset-password' || page === 'signin' || page === 'login' || page === 'user') {
    goToGasApp(page === 'booking' || page === 'signin' || page === 'login' || page === 'user' ? 'ops' : page);
    return;
  }

  var current = getActivePageId();
  if (current === page) {
    if (page === 'home') window.scrollTo(0, 0);
    return;
  }

  if (typeof stopMobileRailAutoplay_ === 'function') stopMobileRailAutoplay_();
  if (typeof stopShowreelLoop_ === 'function') stopShowreelLoop_();
  if (typeof closeGalleryLightbox === 'function') {
    try { closeGalleryLightbox(); } catch (e0) {}
  }

  document.querySelectorAll('.page.active').forEach(function(el) {
    el.classList.remove('active');
  });

  var targetId = page === 'home' ? 'home' : page;
  var target = document.getElementById(targetId);
  if (target) target.classList.add('active');

  if (typeof updateLgNavActive_ === 'function') updateLgNavActive_(page);
  if (typeof updateLgFooterLinks_ === 'function') updateLgFooterLinks_(page);
  document.querySelectorAll('.mobile-tab').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-page') === page);
  });

  window.scrollTo(0, 0);

  if (page === 'gallery' && typeof initGallery === 'function') initGallery();
  if (page === 'about' && typeof initAboutPage === 'function') initAboutPage();
  if (page === 'home') {
    if (typeof initLandingPage === 'function') initLandingPage();
    if (typeof startShowreelLoop_ === 'function') startShowreelLoop_();
  }

  try {
    var url = new URL(window.location.href);
    if (page === 'home') url.searchParams.delete('page');
    else url.searchParams.set('page', page);
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch (e1) {}
}

document.addEventListener('DOMContentLoaded', function() {
  document.body.classList.add('public-site');

  var initial = 'home';
  try {
    var params = new URLSearchParams(window.location.search || '');
    var q = String(params.get('page') || '').trim().toLowerCase();
    if (q === 'faq-contact') q = 'about';
    if (q === 'gallery' || q === 'about' || q === 'home') initial = q;
    if (q === 'ops' || q === 'booking' || q === 'reset-password' || q === 'signin' || q === 'login' || q === 'user') {
      goToGasApp(q === 'booking' || q === 'signin' || q === 'login' || q === 'user' ? 'ops' : q);
      return;
    }
  } catch (e2) {}

  document.querySelectorAll('.page.active').forEach(function(el) {
    el.classList.remove('active');
  });
  var startEl = document.getElementById(initial === 'home' ? 'home' : initial);
  if (startEl) startEl.classList.add('active');

  if (initial === 'home' && typeof initLandingPage === 'function') initLandingPage();
  if (initial === 'gallery' && typeof initGallery === 'function') initGallery();
  if (initial === 'about' && typeof initAboutPage === 'function') initAboutPage();

  if (typeof updateLgNavActive_ === 'function') updateLgNavActive_(initial);
  if (typeof updateLgFooterLinks_ === 'function') updateLgFooterLinks_(initial);
  document.querySelectorAll('.mobile-tab').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-page') === initial);
  });

  warmGasApp_();
  if (window.requestIdleCallback) {
    window.requestIdleCallback(warmGasApp_, { timeout: 800 });
  } else {
    window.setTimeout(warmGasApp_, 200);
  }
  var cta = document.getElementById('lg-nav-cta');
  if (cta) {
    cta.addEventListener('pointerenter', warmGasApp_, { passive: true });
    cta.addEventListener('focus', warmGasApp_, { passive: true });
  }
});
"""


def build_logos_js() -> str:
    return """
(function applyLgOfficialLogos() {
  // File names are relative to background, not ink: *-light = black text, *-dark = white text.
  var black = 'assets/fa-logo-light.png';
  var white = 'assets/fa-logo-dark.png';
  var icon = 'assets/fa-app-icon.png';
  var hero = 'assets/FAS01822-hero.jpg';
  var toastIcon = 'assets/lg-toast-icon.png';

  function setFavicon(src) {
    var variants = [
      { key: 'icon', rel: 'icon', sizes: '512x512' },
      { key: 'apple', rel: 'apple-touch-icon', sizes: '180x180' }
    ];
    variants.forEach(function(v) {
      var el = document.querySelector('link[data-fa-favicon="' + v.key + '"]');
      if (!el) {
        el = document.createElement('link');
        el.rel = v.rel;
        el.type = 'image/png';
        el.setAttribute('sizes', v.sizes);
        el.setAttribute('data-fa-favicon', v.key);
        document.head.appendChild(el);
      }
      el.href = src;
    });
  }

  function fill() {
    document.querySelectorAll('[data-lg-logo="black"]').forEach(function(img) {
      if (img.getAttribute('src') !== black) img.src = black;
    });
    document.querySelectorAll('[data-lg-logo="white"]').forEach(function(img) {
      if (img.getAttribute('src') !== white) img.src = white;
    });
    document.querySelectorAll('[data-lg-logo="icon"]').forEach(function(img) {
      if (img.getAttribute('src') !== icon) img.src = icon;
    });
    document.querySelectorAll('[data-lg-hero-stage]').forEach(function(img) {
      if (img.getAttribute('src') !== hero) img.src = hero;
    });
    document.querySelectorAll('#lg-toast-layer [data-lg-logo="icon"]').forEach(function(img) {
      if (toastIcon) img.src = toastIcon;
    });
    setFavicon(icon);
  }

  fill();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill);
  }
})();
"""


def copy_assets() -> None:
    ASSETS_OUT.mkdir(parents=True, exist_ok=True)
    names = [
        "fa-app-icon.png",
        "fa-logo-dark.png",
        "fa-logo-light.png",
        "lg-toast-icon.png",
        "FAS01822-hero.jpg",
    ]
    for name in names:
        src = ASSETS_SRC / name
        if not src.exists():
            raise SystemExit(f"Missing asset: {src}")
        shutil.copy2(src, ASSETS_OUT / name)


def write_config_if_needed() -> None:
    cfg = OUT / "config.js"
    if cfg.exists():
        return
    cfg.write_text(
        """// URL Web App Google Apps Script (Deploy → Manage deployments → /exec)
// Contoh: 'https://script.google.com/macros/s/AKfycb.../exec'
window.GAS_APP_URL = 'PASTE_YOUR_GAS_EXEC_URL_HERE';
""",
        encoding="utf-8",
    )


def write_vercel_json() -> None:
    (OUT / "vercel.json").write_text(
        """{
  "cleanUrls": true,
  "redirects": [
    { "source": "/signin", "destination": "/user", "permanent": true }
  ],
  "rewrites": [
    { "source": "/ops", "destination": "/user" },
    { "source": "/booking", "destination": "/user" },
    { "source": "/app", "destination": "/user" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
""",
        encoding="utf-8",
    )


def write_readme() -> None:
    (OUT / "README.md").write_text(
        """# FA Studio — Public site + login gate (Vercel)

## Architecture

| Zone | Host | Isi |
|------|------|-----|
| Marketing | Vercel (`fastudio.id`) | Home, Work, Services, About |
| Login gate | Vercel (`/user`) | Halaman login di domain FA Studio |
| System | GAS (di balik gate) | Sign In/Up, client portal, internal ops / bispro |

Setelah lewat gate login, seluruh dashboard client dan internal system di-handle GAS.
URL browser tetap di `fastudio.id/user` (shell Vercel + iframe GAS).

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
| `/user` | **Login / portal / ops gate** → GAS (`user.html`, clean URL) |
| `/signin` | Redirect permanen → `/user` |
| `/app`, `/ops`, `/booking` | Rewrite → `/user` |

## Deploy

1. Vercel Root Directory = `landing`
2. Custom domain `fastudio.id`
3. GAS `doGet` harus `XFrameOptionsMode.ALLOWALL`
4. Setelah ubah auth shell (`IndexAuth`), `clasp push` (+ deploy web app bila perlu)
""",
        encoding="utf-8",
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    styles = strip_style_wrapper((ROOT / "Styles.html").read_text(encoding="utf-8"))
    (OUT / "styles.css").write_text(styles, encoding="utf-8")

    core = (ROOT / "ScriptsCore.html").read_text(encoding="utf-8")
    landing_js = extract_scripts_core_landing(core) + "\n" + build_bridge_js()
    (OUT / "landing.js").write_text(landing_js, encoding="utf-8")
    (OUT / "logos.js").write_text(build_logos_js(), encoding="utf-8")
    write_config_if_needed()
    (OUT / "index.html").write_text(build_index(), encoding="utf-8")
    gate = build_app_html()
    (OUT / "user.html").write_text(gate, encoding="utf-8")
    (OUT / "app.html").write_text(gate, encoding="utf-8")
    signin_legacy = OUT / "signin.html"
    if signin_legacy.exists():
        signin_legacy.unlink()

    copy_assets()
    write_vercel_json()
    write_readme()

    print(f"Built {OUT}")
    print("Vercel: / = marketing · /user = login gate → GAS system")
    print("Next: confirm GAS_APP_URL in landing/config.js, then deploy Root Directory = landing.")


if __name__ == "__main__":
    main()
