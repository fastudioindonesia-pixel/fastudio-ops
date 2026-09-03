#!/usr/bin/env python3
"""Assemble a static Vercel landing site from the GAS public landing sources.

Usage (from repo root):
  python3 tools/build-landing.py

Edit landing sources in the usual places (PageHome.html, Styles.html, ScriptsCore.html,
PartialsNav.html, PartialsLgFooter.html), then re-run this script before deploy.
"""

from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "landing"
ASSETS_SRC = ROOT / "assets"
ASSETS_OUT = OUT / "assets"


def strip_style_wrapper(text: str) -> str:
    text = text.strip()
    m = re.match(r"^<style[^>]*>(.*)</style>\s*$", text, flags=re.I | re.S)
    return m.group(1).strip() + "\n" if m else text


def strip_script_wrapper(text: str) -> str:
    text = text.strip()
    m = re.match(r"^<script[^>]*>(.*)</script>\s*$", text, flags=re.I | re.S)
    return m.group(1).strip() + "\n" if m else text


def extract_scripts_core_landing(raw: str) -> str:
    """Pull landing-only JS from ScriptsCore.html (no gallery / ops)."""
    lines = raw.splitlines()
    # Drop outer <script> if present
    if lines and lines[0].strip().lower().startswith("<script"):
        lines = lines[1:]
    if lines and lines[-1].strip().lower().startswith("</script"):
        lines = lines[:-1]

    chunks: list[str] = []
    # Constant used by CTA year counter
    chunks.append("var FA_STUDIO_SINCE_YEAR_ = 2021;\n")

    # LG landing block: LG_SERVICES … end of animateCtaCounters_ (before GALLERY_*)
    start = next(i for i, l in enumerate(lines) if l.startswith("var LG_SERVICES = ["))
    end = next(i for i, l in enumerate(lines) if l.startswith("var GALLERY_CATEGORIES = ["))
    chunks.append("\n".join(lines[start:end]).rstrip() + "\n")

    # Mobile rail autoplay (used by initLandingPage)
    rail_start = next(i for i, l in enumerate(lines) if l.startswith("var _mobileRailAuto = null;"))
    rail_end = next(i for i, l in enumerate(lines) if l.startswith("function galleryCategoryLabel"))
    chunks.append("\n".join(lines[rail_start:rail_end]).rstrip() + "\n")
    return "\n".join(chunks)


def patch_home_html(html: str) -> str:
    html = re.sub(r"<\?!=\s*include\([^)]+\)\s*;?\s*\?>", "", html)
    # Play button / service cards still call setPage — stubs handle that.
    return html


def build_index() -> str:
    nav = (ROOT / "PartialsNav.html").read_text(encoding="utf-8")
    home = patch_home_html((ROOT / "PageHome.html").read_text(encoding="utf-8"))
    footer = (ROOT / "PartialsLgFooter.html").read_text(encoding="utf-8")
    # Inject footer where include was (already stripped) — append before closing shell if missing
    if "lg-footer" not in home:
        home = home.rstrip()
        if home.endswith("</div>"):
            # close lg-shell + #home already in file; insert footer before last two closes is fragile —
            # PageHome ends with include then </div></div>. After strip, put footer before final closes.
            home = re.sub(
                r"(</div>\s*</div>\s*)$",
                footer + r"\n\1",
                home,
                count=1,
            )
        else:
            home = home + "\n" + footer + "\n"

    return f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>FA Studio Indonesia</title>
<meta name="description" content="FA Studio Indonesia — Yours Unlimited Creativity. Film, photo, and 3D production."/>
<link rel="icon" href="assets/fa-app-icon.png" type="image/png" sizes="512x512"/>
<link rel="apple-touch-icon" href="assets/fa-app-icon.png" sizes="180x180"/>
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
<script src="config.js"></script>
<script src="logos.js"></script>
<script src="landing.js"></script>
</body>
</html>
"""


def build_bridge_js() -> str:
    return r"""
/* Bridge: landing stays static; app actions open the GAS web app. */
function gasAppUrl_(page) {
  var base = (window.GAS_APP_URL || '').replace(/\/$/, '');
  if (!base || base.indexOf('PASTE_') === 0) {
    console.warn('[landing] Set GAS_APP_URL in landing/config.js to your Apps Script /exec URL.');
    return '';
  }
  if (!page || page === 'home') return base;
  return base + '?page=' + encodeURIComponent(page);
}

function warmGasApp_() {
  var url = gasAppUrl_('ops');
  if (!url) return;
  try {
    fetch(url, { mode: 'no-cors', credentials: 'omit', cache: 'no-store', keepalive: true });
  } catch (e1) {}
  try {
    var img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_warm=' + Date.now();
  } catch (e2) {}
}

function showGasRedirectOverlay_() {
  if (document.getElementById('fa-gas-redirect')) return;
  var el = document.createElement('div');
  el.id = 'fa-gas-redirect';
  el.setAttribute('role', 'status');
  el.innerHTML = '<div class="fa-gas-redirect-card"><div class="fa-gas-redirect-spin" aria-hidden="true"></div><strong>Membuka aplikasi…</strong><span>Menyiapkan halaman login FA Studio</span></div>';
  var css = document.createElement('style');
  css.textContent = '#fa-gas-redirect{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(248,248,246,.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#070707}'
    + '.fa-gas-redirect-card{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:28px}'
    + '.fa-gas-redirect-card strong{font-size:18px;letter-spacing:-.02em}'
    + '.fa-gas-redirect-card span{font-size:13px;opacity:.62}'
    + '.fa-gas-redirect-spin{width:28px;height:28px;border-radius:50%;border:2px solid rgba(7,7,7,.12);border-top-color:#070707;animation:faGasSpin .7s linear infinite}'
    + '@keyframes faGasSpin{to{transform:rotate(360deg)}}';
  document.head.appendChild(css);
  document.body.appendChild(el);
}

function goToGasApp(page) {
  var url = gasAppUrl_(page || 'ops');
  if (!url) {
    alert('URL aplikasi belum di-set. Isi GAS_APP_URL di landing/config.js, lalu rebuild/deploy ulang.');
    return;
  }
  showGasRedirectOverlay_();
  warmGasApp_();
  window.setTimeout(function() { window.location.href = url; }, 40);
}

function goPublicHome() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  var home = document.getElementById('home');
  if (home) home.classList.add('active');
  if (typeof updateLgNavActive_ === 'function') updateLgNavActive_('home');
  if (typeof updateLgFooterLinks_ === 'function') updateLgFooterLinks_('home');
}

function openStartProject() {
  goToGasApp('ops');
}

function setPage(page) {
  if (page === 'faq-contact') page = 'about';
  if (page === 'booking' || page === 'ops' || page === 'reset-password') {
    goToGasApp(page === 'booking' ? 'ops' : page);
    return;
  }
  if (page === 'gallery') {
    var work = document.getElementById('lg-work');
    if (work) work.scrollIntoView({ behavior: 'smooth' });
    if (typeof updateLgNavActive_ === 'function') updateLgNavActive_('gallery');
    if (typeof updateLgFooterLinks_ === 'function') updateLgFooterLinks_('gallery');
    return;
  }
  if (page === 'about') {
    var about = document.getElementById('lg-about');
    if (about) about.scrollIntoView({ behavior: 'smooth' });
    if (typeof updateLgNavActive_ === 'function') updateLgNavActive_('about');
    if (typeof updateLgFooterLinks_ === 'function') updateLgFooterLinks_('about');
    return;
  }
  goPublicHome();
}

document.addEventListener('DOMContentLoaded', function() {
  document.body.classList.add('public-site');
  var home = document.getElementById('home');
  if (home) home.classList.add('active');
  if (typeof initLandingPage === 'function') initLandingPage();
  if (typeof updateLgNavActive_ === 'function') updateLgNavActive_('home');
  if (typeof updateLgFooterLinks_ === 'function') updateLgFooterLinks_('home');
  warmGasApp_();
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
  var black = 'assets/fa-logo-dark.png';
  var white = 'assets/fa-logo-light.png';
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
        """# FA Studio — Landing (Vercel)

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
    (OUT / "index.html").write_text(build_index(), encoding="utf-8")

    copy_assets()
    write_config_if_needed()
    write_vercel_json()
    write_readme()

    print(f"Built {OUT}")
    print("Next: set GAS_APP_URL in landing/config.js, then deploy Root Directory = landing on Vercel.")


if __name__ == "__main__":
    main()
