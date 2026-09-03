var FA_STUDIO_SINCE_YEAR_ = 2021;

var LG_SERVICES = [
  { icon: 'book', title: 'Yearbook & Video Angkatan', desc: 'Mengubah cerita satu angkatan menjadi pengalaman visual yang personal, fun, dan memorable.', glow: 'violet' },
  { icon: 'music', title: 'Music Video Commercial', desc: 'Music video dan commercial yang ritmis, cinematic, dan punya karakter visual yang kuat.', glow: 'warm' },
  { icon: 'video', title: 'Video & Film Production', desc: 'Film, campaign, aftermovie, dan visual storytelling yang dibuat untuk meninggalkan kesan.', glow: 'teal' },
  { icon: 'content', title: 'Content Specialist', desc: 'Konten visual yang strategik untuk brand, social, dan komunikasi yang lebih sharp.', glow: 'blue' },
  { icon: 'spark', title: '3D Animation', desc: 'Animasi 3D dan creative visual untuk membuat ide terasa lebih hidup dan immersive.', glow: 'violet' }
];

function lgSvcIconSvg_(kind) {
  var common = ' class="lg-svc-icon-svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  if (kind === 'video') {
    return '<svg' + common + '><rect x="2.5" y="5.5" width="14" height="13" rx="2.2"/><path d="M16.5 10.2 21.5 7.4v9.2L16.5 13.8z"/></svg>';
  }
  if (kind === 'book') {
    return '<svg' + common + '><path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H20v16.5H6.4A2.4 2.4 0 0 0 4 21.9z"/><path d="M4 5.2V21.9"/><path d="M8 7.5h8M8 11h6"/></svg>';
  }
  if (kind === 'music') {
    return '<svg' + common + '><path d="M9 18V6.8l11-2.2V16"/><circle cx="7" cy="18" r="2.4"/><circle cx="18" cy="16" r="2.4"/></svg>';
  }
  if (kind === 'content') {
    return '<svg' + common + '><rect x="3.5" y="4.5" width="17" height="15" rx="2.2"/><path d="M7.5 9h9M7.5 12.5h9M7.5 16h5.5"/></svg>';
  }
  if (kind === 'camera') {
    return '<svg' + common + '><path d="M4.5 8.2h2.1l1.3-2.1h8.2l1.3 2.1h2.1A1.8 1.8 0 0 1 21.3 10v8.1a1.8 1.8 0 0 1-1.8 1.8H4.5A1.8 1.8 0 0 1 2.7 18.1V10a1.8 1.8 0 0 1 1.8-1.8z"/><circle cx="12" cy="13.6" r="3.2"/><circle cx="18.2" cy="10.4" r=".7" fill="currentColor" stroke="none"/></svg>';
  }
  return '<svg' + common + '><path d="M12 2.8 13.7 9h6.5l-5.3 3.9 2 6.2L12 15.7 7.1 19.1l2-6.2L3.8 9h6.5z"/></svg>';
}

var LG_WORK = [
  { no: '01', tone: '', kicker: 'CEREMONY CLIP', title: 'Abhipraya 26', year: '2026', word: 'FA<br>STUDIO', cover: 'https://picsum.photos/seed/fa-lg-w1/900/1100' },
  { no: '02', tone: 'light', kicker: 'BEHIND THE SCENES', title: 'MAS Aisyiyah', year: '2026', word: 'BTS', cover: 'https://picsum.photos/seed/fa-lg-w2/900/1100' },
  { no: '03', tone: 'mid', kicker: 'YEARBOOK FILM', title: 'Video Angkatan', year: '2025', word: 'YEAR<br>BOOK', cover: 'https://picsum.photos/seed/fa-lg-w3/900/1100' },
  { no: '04', tone: '', kicker: 'COMMERCIAL FILM', title: 'Brand Stories', year: '2025', word: 'FILM', cover: 'https://picsum.photos/seed/fa-lg-w4/900/1100' }
];

function buildLgServices_() {
  var grid = document.getElementById('lg-service-grid');
  if (!grid) return;
  grid.innerHTML = LG_SERVICES.map(function(item) {
    return '<article class="lg-svc-card lg-svc-' + item.glow + '" role="button" tabindex="0" onclick="setPage(\'gallery\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();setPage(\'gallery\')}">'
      + '<div class="lg-svc-glow" aria-hidden="true"></div>'
      + '<div class="lg-svc-glass">'
      + '<span class="lg-svc-icon">' + lgSvcIconSvg_(item.icon) + '</span>'
      + '<h3>' + item.title + '</h3>'
      + '<p>' + item.desc + '</p>'
      + '<span class="lg-svc-link">Learn more</span>'
      + '</div>'
      + '</article>';
  }).join('');
}

function buildLgWork_() {
  var grid = document.getElementById('lg-work-grid');
  if (!grid) return;
  grid.innerHTML = LG_WORK.map(function(item) {
    var cls = 'lg-work-card' + (item.tone ? ' ' + item.tone : '');
    return '<article class="' + cls + '" role="button" tabindex="0" onclick="setPage(\'gallery\')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();setPage(\'gallery\')}">'
      + '<img class="lg-work-photo" src="' + item.cover + '" alt="" loading="lazy" decoding="async"/>'
      + '<span class="lg-work-no">' + item.no + '</span>'
      + '<div class="lg-art">'
      + '<span class="lg-line"></span><span class="lg-circle"></span>'
      + '<span class="lg-art-word">' + item.word + '</span>'
      + '</div>'
      + '<div class="lg-work-info">'
      + '<div><small>' + item.kicker + '</small><h3>' + item.title + '</h3></div>'
      + '<small>' + item.year + '</small>'
      + '</div>'
      + '</article>';
  }).join('');
}

function buildHomeProjects() {
  buildLgWork_();
}

function lgNavToSection_(id) {
  var home = document.getElementById('home');
  if (home && home.classList.contains('active')) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  setPage('home');
  window.setTimeout(function() {
    var target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }, 320);
}

function updateLgNavActive_(page) {
  var home = document.getElementById('lg-nav-home');
  if (home) home.classList.toggle('is-active', page === 'home');
  var work = document.getElementById('lg-nav-work');
  if (work) work.classList.toggle('is-active', page === 'gallery');
  var about = document.getElementById('lg-nav-about');
  if (about) about.classList.toggle('is-active', page === 'about');
}

function updateLgFooterLinks_(page) {
  document.querySelectorAll('[data-lg-footer-link]').forEach(function(btn) {
    var linkPage = btn.getAttribute('data-lg-footer-link');
    btn.hidden = linkPage === page;
  });
}

function initLandingPage() {
  buildLgServices_();
  buildLgWork_();
  initShowreelScroll_();
  scheduleMobileRailAutoplay_();
}

var _lgShowreelRaf = 0;
var _lgShowreelBound = false;
var _lgShowreelChapter = '01';
var _lgToastDismissed = [false, false, false];
var _lgMobileToastIdx = 0;
var _lgMobileToastTimer = null;
var _lgMobileToastStarted = false;
var LG_TOAST_ITEMS = [
  {
    title: 'The Ultimate Graduation Film is Here.',
    copy: 'Bukan sekadar dokumentasi biasa—ini visual story satu angkatan yang bakal lu tonton berulang kali.',
    time: 'now'
  },
  {
    title: 'Next-Level Visuals: 3D Universe Drop.',
    copy: 'Bukan visual 3D yang biasa lo lihat. Kita bawa ide gila lo jadi karya 3D animasi yang unreal dan bikin nagih.',
    time: '1m ago'
  },
  {
    title: 'Make Your Brand Impossible to Ignore.',
    copy: 'Persaingan lagi ketat, visual brand lo gak boleh mid. Kita bikin iklan produk lo punya main character energy.',
    time: '2m ago'
  }
];

function lgClamp01_(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lgEase_(t) {
  var p = lgClamp01_(t);
  return p * p * (3 - 2 * p);
}

function lgIsMobile_() {
  return window.matchMedia('(max-width:850px)').matches;
}

function syncCreativityStageMargin_() {
  var home = document.getElementById('home');
  if (!home || !home.classList.contains('lg-landing')) return;
  var stageEl = home.querySelector('.lg-hero-stage');
  if (!stageEl) return;
  if (!lgIsMobile_()) {
    stageEl.style.removeProperty('margin-top');
    return;
  }
  var word = home.querySelector('.lg-hero-creativity');
  var stageImg = home.querySelector('.lg-stage-image');
  if (!word || !stageImg) return;

  var baseMt = window.matchMedia('(max-width:560px)').matches ? -38 : -52;
  var photoDown = window.matchMedia('(max-width:560px)').matches ? 16 : 22;
  stageEl.style.marginTop = baseMt + 'px';
  var gap = stageImg.getBoundingClientRect().top - word.getBoundingClientRect().top;
  stageEl.style.marginTop = (gap > 0 ? baseMt - gap - 4 + photoDown : baseMt - 4 + photoDown) + 'px';
}

function syncCreativitySplit_() {
  var home = document.getElementById('home');
  if (!home || !home.classList.contains('lg-landing')) return;
  var word = home.querySelector('.lg-hero-creativity');
  var stage = home.querySelector('.lg-stage-image');
  if (!word || !stage) return;
  if (!lgIsMobile_()) {
    word.style.removeProperty('--lg-creativity-white-clip');
    return;
  }
  var wr = word.getBoundingClientRect();
  var sr = stage.getBoundingClientRect();
  if (wr.height <= 0) return;
  var split = ((sr.top - wr.top) / wr.height) * 100;
  split = Math.max(0, Math.min(100, split));
  word.style.setProperty('--lg-creativity-white-clip', 'inset(' + split.toFixed(2) + '% 0 0 0)');
}

function syncCreativityLayout_() {
  syncCreativityStageMargin_();
  syncCreativitySplit_();
}

function bindCreativitySplitListeners_() {
  if (window._lgCreativitySplitBound) return;
  window._lgCreativitySplitBound = true;
  var run = function() { requestAnimationFrame(syncCreativityLayout_); };
  window.addEventListener('resize', run, { passive: true });
  window.addEventListener('orientationchange', run);
  var photo = document.querySelector('#home .lg-stage-photo');
  if (photo) {
    if (photo.complete) run();
    else photo.addEventListener('load', run, { once: true });
  }
}


function fillLgToastEl_(toast, item) {
  if (!toast || !item) return;
  var title = toast.querySelector('.lg-toast-title');
  var copy = toast.querySelector('.lg-toast-copy');
  var time = toast.querySelector('.lg-toast-time');
  if (title) title.textContent = item.title;
  if (copy) copy.textContent = item.copy;
  if (time) time.textContent = item.time || 'now';
}

function dismissLgToast_(idx) {
  var i = Number(idx);
  if (isNaN(i) || i < 0 || i > 2) return;
  _lgToastDismissed[i] = true;
  var toast = document.querySelector('.lg-toast[data-toast="' + i + '"]');
  if (toast) {
    toast.classList.remove('is-on');
    toast.style.setProperty('--toast-p', '0');
    toast.setAttribute('aria-hidden', 'true');
  }
  if (lgIsMobile_()) {
    // Langsung lanjut ke toast berikutnya
    if (_lgMobileToastTimer) clearTimeout(_lgMobileToastTimer);
    setTimeout(function() { _lgRunMobileToastSequence_(i + 1); }, 220);
    return;
  }
  updateLgToast_();
}

function initLgToast_() {
  var layer = document.getElementById('lg-toast-layer');
  var toasts = document.querySelectorAll('#home .lg-toast[data-toast]');
  if (!layer || !toasts.length) return;
  // Reset state
  if (_lgMobileToastTimer) { clearTimeout(_lgMobileToastTimer); _lgMobileToastTimer = null; }
  _lgMobileToastStarted = false;
  _lgMobileToastIdx = 0;
  _lgToastDismissed = [false, false, false];
  toasts.forEach(function(toast) {
    var i = Number(toast.getAttribute('data-toast') || 0);
    fillLgToastEl_(toast, LG_TOAST_ITEMS[i] || LG_TOAST_ITEMS[0]);
    toast.style.setProperty('--toast-p', '0');
    toast.setAttribute('aria-hidden', 'true');
    toast.classList.remove('is-on');
  });
  if (layer.dataset.bound !== '1') {
    layer.dataset.bound = '1';
    layer.addEventListener('click', function(e) {
      var btn = e.target.closest('.lg-toast-dismiss');
      if (!btn) return;
      var card = btn.closest('.lg-toast[data-toast]');
      if (!card) return;
      dismissLgToast_(card.getAttribute('data-toast'));
    });
  }
  if (lgIsMobile_()) {
    _lgStartMobileToastSequence_();
  }
  updateLgToast_();
}

function _lgStartMobileToastSequence_() {
  if (_lgMobileToastTimer) clearTimeout(_lgMobileToastTimer);
  _lgMobileToastStarted = false;
  _lgMobileToastIdx = 0;
  // Tunggu hero masuk viewport, baru mulai sequence
  var stageImg = document.querySelector('#home .lg-stage-image');
  if (!stageImg) { _lgRunMobileToastSequence_(); return; }
  var obs = new IntersectionObserver(function(entries, o) {
    if (entries[0].isIntersecting && !_lgMobileToastStarted) {
      _lgMobileToastStarted = true;
      o.disconnect();
      // Delay singkat sebelum toast pertama muncul
      _lgMobileToastTimer = setTimeout(_lgRunMobileToastSequence_, 900);
    }
  }, { threshold: 0.4 });
  obs.observe(stageImg);
}

function _lgRunMobileToastSequence_(idx) {
  if (idx === undefined) idx = 0;
  var toasts = document.querySelectorAll('#home .lg-toast[data-toast]');
  var total = toasts.length;
  if (!lgIsMobile_()) return;

  // Sembunyikan semua dulu
  toasts.forEach(function(t) {
    t.style.setProperty('--toast-p', '0');
    t.classList.remove('is-on');
    t.setAttribute('aria-hidden', 'true');
  });

  if (idx >= total) {
    // Semua sudah tampil, jeda lalu ulang dari awal (looping)
    _lgMobileToastTimer = setTimeout(function() { _lgRunMobileToastSequence_(0); }, 1800);
    return;
  }

  if (_lgToastDismissed[idx]) {
    // Toast ini di-dismiss, skip ke berikutnya
    _lgMobileToastTimer = setTimeout(function() { _lgRunMobileToastSequence_(idx + 1); }, 0);
    return;
  }

  _lgMobileToastIdx = idx;
  updateLgToast_();

  // Tampil selama 2.4 detik, lalu animasi keluar (0.3s), lalu toast berikutnya
  _lgMobileToastTimer = setTimeout(function() {
    var t = document.querySelector('#home .lg-toast[data-toast="' + idx + '"]');
    if (t) {
      t.style.setProperty('--toast-p', '0');
      t.classList.remove('is-on');
    }
    setTimeout(function() { _lgRunMobileToastSequence_(idx + 1); }, 320);
  }, 2400);
}

function lgStageProgress_() {
  var wrap = document.getElementById('lg-stage-wrap');
  if (!wrap) return 0;
  var wrapRect = wrap.getBoundingClientRect();
  var vh = window.innerHeight || 1;
  var scrollable = wrap.offsetHeight - vh;
  if (scrollable < 1) scrollable = 1;
  return lgClamp01_(-wrapRect.top / scrollable);
}

function updateLgToast_() {
  var home = document.getElementById('home');
  var stage = document.getElementById('lg-hero-stage');
  var toasts = document.querySelectorAll('#home .lg-toast[data-toast]');
  if (!toasts.length) return;
  if (!home || !home.classList.contains('active') || !home.classList.contains('lg-landing')) {
    toasts.forEach(function(toast) {
      toast.style.setProperty('--toast-p', '0');
      toast.classList.remove('is-on');
      toast.setAttribute('aria-hidden', 'true');
    });
    if (stage) stage.classList.remove('is-toasting');
    return;
  }

  var anyOn = false;

  if (lgIsMobile_()) {
    // Mobile: hanya satu toast aktif sekaligus — yang aktif = _lgMobileToastIdx
    toasts.forEach(function(toast) {
      var i = Number(toast.getAttribute('data-toast') || 0);
      var isActive = (i === _lgMobileToastIdx) && !_lgToastDismissed[i];
      var p = isActive ? 1 : 0;
      toast.style.setProperty('--toast-p', p.toFixed(1));
      if (isActive) {
        toast.classList.add('is-on');
        toast.setAttribute('aria-hidden', 'false');
        anyOn = true;
      } else {
        toast.classList.remove('is-on');
        toast.setAttribute('aria-hidden', 'true');
      }
    });
    if (stage) stage.classList.toggle('is-toasting', anyOn);
    return;
  }

  var progress = lgStageProgress_();
  var windows = [
    [0.06, 0.28],
    [0.30, 0.52],
    [0.54, 0.76]
  ];
  toasts.forEach(function(toast) {
    var i = Number(toast.getAttribute('data-toast') || 0);
    if (_lgToastDismissed[i]) {
      toast.style.setProperty('--toast-p', '0');
      toast.classList.remove('is-on');
      toast.setAttribute('aria-hidden', 'true');
      return;
    }
    var win = windows[i] || windows[0];
    var p = lgEase_((progress - win[0]) / (win[1] - win[0]));
    toast.style.setProperty('--toast-p', p.toFixed(3));
    if (p > 0.08) {
      toast.classList.add('is-on');
      toast.setAttribute('aria-hidden', 'false');
      anyOn = true;
    } else {
      toast.classList.remove('is-on');
      toast.setAttribute('aria-hidden', 'true');
    }
  });
  if (stage) stage.classList.toggle('is-toasting', anyOn);
}

function splitAboutHeading_() {
  var h2 = document.getElementById('lg-about-heading');
  if (!h2 || h2.dataset.split === '1') return;
  var text = (h2.textContent || '').trim();
  var words = text.split(/\s+/);
  h2.innerHTML = words.map(function(word) {
    return '<span class="lg-about-word">' + word + '</span>';
  }).join(' ');
  h2.dataset.split = '1';
}

function updateAboutWords_() {
  var wrap = document.getElementById('lg-about-wrap');
  var h2 = document.getElementById('lg-about-heading');
  if (!wrap || !h2) return;
  var vh = window.innerHeight || 1;
  var spans = h2.querySelectorAll('.lg-about-word');
  var total = spans.length;
  if (!total) return;

  var progress;
  if (lgIsMobile_()) {
    // Mobile: progress dari posisi h2 di viewport (scroll-based, no pin)
    var h2r = h2.getBoundingClientRect();
    // 0 = h2 di bawah layar, 1 = h2 sudah lewat tengah layar
    progress = lgClamp01_((vh * 0.82 - h2r.top) / (h2r.height + vh * 0.28));
  } else {
    var wrapRect = wrap.getBoundingClientRect();
    var scrollable = wrap.offsetHeight - vh;
    if (scrollable < 1) scrollable = 1;
    progress = lgClamp01_(-wrapRect.top / scrollable);
  }

  for (var i = 0; i < total; i++) {
    var wordStart = i / total;
    var wordEnd = (i + 1) / total;
    var wordT = lgClamp01_((progress - wordStart) / (wordEnd - wordStart));
    var opacity = 0.18 + wordT * 0.82;
    spans[i].style.setProperty('--w-o', opacity.toFixed(3));
  }
}

function updateNavTheme_() {
  var nav = document.getElementById('lg-nav');
  if (!nav) return;
  var home = document.getElementById('home');
  var isHome = home && home.classList.contains('active');
  var d = '0';
  if (isHome) {
    var max = (document.documentElement.scrollHeight || 1) - (window.innerHeight || 1);
    if (max < 1) max = 1;
    var p = lgClamp01_((window.scrollY || 0) / max);
    var mix = lgClamp01_((p - 0.38) / 0.62);
    mix = mix * mix * (3 - 2 * mix);
    d = mix.toFixed(3);
  }
  nav.style.setProperty('--nav-d', d);
  document.documentElement.style.setProperty('--nav-d', d);
}

function updateCtaRings_() {
  var cta = document.getElementById('lg-contact');
  if (!cta) return;
  var r = cta.getBoundingClientRect();
  var vh = window.innerHeight || 1;
  var mid = r.top + r.height * 0.45;
  var t = lgClamp01_(1 - Math.abs(mid - vh * 0.5) / (vh * 0.85));
  t = t * t * (3 - 2 * t);
  cta.querySelectorAll('.lg-cta-ring').forEach(function(ring, i) {
    var local = lgClamp01_(t * (1.15 - i * 0.08));
    ring.style.setProperty('--ring-p', local.toFixed(3));
  });
}

function updateServicesScroll_() {
  var section = document.getElementById('lg-services');
  if (!section) return;
  var vh = window.innerHeight || 1;
  var isMobile = window.matchMedia('(max-width:850px)').matches;
  var cards = section.querySelectorAll('.lg-svc-card');
  cards.forEach(function(card, i) {
    var r = card.getBoundingClientRect();
    var start = vh * ((isMobile ? 0.86 : 0.92) - i * (isMobile ? 0.07 : 0.04));
    var range = vh * (isMobile ? 0.34 : 0.38);
    var t = lgClamp01_((start - r.top) / range);
    t = t * t * (3 - 2 * t);
    card.style.setProperty('--svc-on', t.toFixed(3));
  });
}

function updateShowreelHero_() {
  var home = document.getElementById('home');
  if (!home || !home.classList.contains('active') || !home.classList.contains('lg-landing')) {
    return false;
  }
  var heading = home.querySelector('.lg-hero-heading');
  var photo = home.querySelector('.lg-stage-photo');
  var stage = home.querySelector('.lg-stage-image');
  var vh = window.innerHeight || 1;
  var y = window.scrollY || 0;
  var ease = lgEase_(y / (vh * 0.72));

  if (heading) {
    heading.style.opacity = String((1 - ease * 0.92).toFixed(3));
    heading.style.transform = 'translate3d(0,' + (-28 * ease).toFixed(1) + 'px,0)';
  }
  if (photo) photo.style.setProperty('--lg-dolly', (1 + ease * 0.14).toFixed(4));
  if (stage) {
    var rect = stage.getBoundingClientRect();
    var vis = lgClamp01_(1 - Math.abs(rect.top + rect.height * 0.35 - vh * 0.5) / (vh * 0.9));
    stage.style.opacity = String((0.72 + vis * 0.28).toFixed(3));
  }

  updateLgToast_();

  home.querySelectorAll('.lg-work-card').forEach(function(cardEl) {
    var r = cardEl.getBoundingClientRect();
    var p = lgClamp01_((vh - r.top) / (vh + r.height));
    var enter = lgClamp01_((vh * 0.9 - r.top) / (vh * 0.42));
    cardEl.style.setProperty('--wk-on', enter.toFixed(3));
    var photoEl = cardEl.querySelector('.lg-work-photo');
    if (photoEl) photoEl.style.setProperty('--lg-photo-y', ((p - 0.5) * 28).toFixed(1) + 'px');
  });
  return true;
}

function syncShowreelChapter_() {
  var indexEl = document.getElementById('lg-hero-index');
  var nodes = document.querySelectorAll('[data-lg-chapter]');
  if (!nodes.length) return;
  var pick = '01';
  var best = -1;
  var mid = (window.innerHeight || 0) * 0.38;
  nodes.forEach(function(el) {
    var r = el.getBoundingClientRect();
    var score = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
    if (r.top < mid && r.bottom > 80 && score > best) {
      best = score;
      pick = el.getAttribute('data-lg-chapter') || '01';
    }
  });
  if (pick !== _lgShowreelChapter) {
    _lgShowreelChapter = pick;
    if (indexEl) indexEl.textContent = pick + ' / 04';
  }
}

// Safety net: kalau IntersectionObserver tidak sempat jalan, section
// ber-class lg-reveal akan tetap opacity:0 dan terlihat sebagai halaman putih.
var _lgRevealPending = null;

function revealVisibleLgSections_() {
  var home = document.getElementById('home');
  if (!home) return;
  if (!_lgRevealPending) {
    _lgRevealPending = Array.prototype.slice.call(home.querySelectorAll('.lg-reveal, .lg-cta'));
  }
  if (!_lgRevealPending.length) return;
  var vh = window.innerHeight || 1;
  _lgRevealPending = _lgRevealPending.filter(function(el) {
    if (el.classList.contains('is-in')) return false;
    var r = el.getBoundingClientRect();
    if (r.top < vh * 0.9 && r.bottom > 0) {
      el.classList.add('is-in');
      return false;
    }
    return true;
  });
}

function showreelFrame_() {
  _lgShowreelRaf = 0;
  var on = updateShowreelHero_();
  if (on) {
    revealVisibleLgSections_();
    updateAboutWords_();
    updateServicesScroll_();
    updateCtaRings_();
    updateNavTheme_();
    syncShowreelChapter_();
    if (lgIsMobile_()) syncCreativitySplit_();
    _lgShowreelRaf = requestAnimationFrame(showreelFrame_);
  }
}

function startShowreelLoop_() {
  if (_lgShowreelRaf) return;
  _lgShowreelRaf = requestAnimationFrame(showreelFrame_);
}

function stopShowreelLoop_() {
  if (_lgShowreelRaf) {
    cancelAnimationFrame(_lgShowreelRaf);
    _lgShowreelRaf = 0;
  }
}

function bindLgScrollModeListener_() {
  if (window._lgScrollModeBound) return;
  window._lgScrollModeBound = true;
  var mq = window.matchMedia('(max-width: 850px)');
  var onChange = function() {
    stopShowreelLoop_();
    _lgRevealPending = null;
    initShowreelScroll_();
    syncCreativityLayout_();
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}

function applyLgStaticScrollState_() {
  var home = document.getElementById('home');
  if (!home) return;
  home.querySelectorAll('.lg-reveal, .lg-cta').forEach(function(el) { el.classList.add('is-in'); });
  home.querySelectorAll('.lg-about-word').forEach(function(word) {
    word.style.setProperty('--w-o', '1');
  });
  document.querySelectorAll('#home .lg-toast[data-toast]').forEach(function(toast) {
    var i = Number(toast.getAttribute('data-toast') || 0);
    if (_lgToastDismissed[i]) {
      toast.style.setProperty('--toast-p', '0');
      toast.classList.remove('is-on');
      toast.setAttribute('aria-hidden', 'true');
      return;
    }
    toast.classList.add('is-on');
    toast.style.setProperty('--toast-p', '1');
    toast.setAttribute('aria-hidden', 'false');
  });
  var stage = document.getElementById('lg-hero-stage');
  if (stage) stage.classList.add('is-toasting');
  var heading = home.querySelector('.lg-hero-heading');
  if (heading) {
    heading.style.opacity = '1';
    heading.style.transform = 'none';
  }
  var photo = home.querySelector('.lg-stage-photo');
  if (photo) photo.style.setProperty('--lg-dolly', '1');
  syncCreativityLayout_();
  syncShowreelChapter_();
}

function initShowreelScroll_() {
  var home = document.getElementById('home');
  if (!home || !home.classList.contains('lg-landing')) return;
  splitAboutHeading_();
  initLgToast_();
  var aboutSec = document.getElementById('lg-about');
  if (aboutSec) aboutSec.classList.add('is-in');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    applyLgStaticScrollState_();
    initCtaEffects_();
    return;
  }

  if (!_lgShowreelBound) {
    _lgShowreelBound = true;
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) entry.target.classList.add('is-in');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    home.querySelectorAll('.lg-reveal, .lg-cta').forEach(function(el) { io.observe(el); });
    window.addEventListener('scroll', function lgScrollCheck_() {
      home.querySelectorAll('.lg-reveal:not(.is-in), .lg-cta:not(.is-in)').forEach(function(el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.88 && r.bottom > 0) el.classList.add('is-in');
      });
    }, { passive: true });
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) stopShowreelLoop_();
      else startShowreelLoop_();
    });
  }

  _lgRevealPending = null;
  revealVisibleLgSections_();
  updateServicesScroll_();
  bindCreativitySplitListeners_();
  syncCreativityLayout_();
  startShowreelLoop_();
  initCtaEffects_();
  bindLgScrollModeListener_();
}

var _ctaCountDone = false;

function initCtaEffects_() {
  var cta = document.getElementById('lg-contact');
  if (!cta) return;
  var rect = cta.getBoundingClientRect();
  if (rect.top < (window.innerHeight || 0) * 0.92) cta.classList.add('is-in');

  cta.addEventListener('mousemove', function(e) {
    var glow = document.getElementById('lg-cta-glow');
    if (!glow) return;
    var r = cta.getBoundingClientRect();
    glow.style.left = (e.clientX - r.left) + 'px';
    glow.style.top = (e.clientY - r.top) + 'px';
  });

  var statsObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !_ctaCountDone) {
        _ctaCountDone = true;
        animateCtaCounters_();
      }
    });
  }, { threshold: 0.3 });
  var stats = document.getElementById('lg-cta-stats');
  if (stats) {
    var yearsEl = stats.querySelector('.lg-cta-num[data-stat="years"]');
    if (yearsEl) {
      yearsEl.setAttribute('data-target', String(Math.max(1, new Date().getFullYear() - FA_STUDIO_SINCE_YEAR_)));
    }
    statsObs.observe(stats);
  }
}

function animateCtaCounters_() {
  var nums = document.querySelectorAll('.lg-cta-num');
  nums.forEach(function(el) {
    var target = parseInt(el.getAttribute('data-target'), 10) || 0;
    var duration = target > 50 ? 2000 : 1200;
    var start = performance.now();
    function step(now) {
      var t = (now - start) / duration;
      if (t > 1) t = 1;
      var ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(ease * target);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

var _mobileRailAuto = null;

function stopMobileRailAutoplay_() {
  if (!_mobileRailAuto) return;
  cancelAnimationFrame(_mobileRailAuto.raf);
  clearTimeout(_mobileRailAuto.idleTimer);
  _mobileRailAuto.entries.forEach(function(entry) {
    entry.el.classList.remove('is-rail-autoplay');
    entry.el.removeEventListener('touchstart', entry.onTouchStart_, true);
    entry.el.removeEventListener('touchmove', entry.onTouchMove_, true);
    entry.el.removeEventListener('touchend', entry.onTouchEnd_, true);
    entry.el.removeEventListener('touchcancel', entry.onTouchEnd_, true);
    entry.el.removeEventListener('pointerdown', entry.onPointerDown_, true);
    entry.el.removeEventListener('scroll', entry.onScroll_);
    if (entry.io) entry.io.disconnect();
    if (entry.el.dataset.railCloned === '1') {
      var half = Math.floor(entry.el.children.length / 2);
      while (entry.el.children.length > half) entry.el.removeChild(entry.el.lastChild);
      entry.el.dataset.railCloned = '0';
      entry.el.scrollLeft = 0;
    }
  });
  _mobileRailAuto = null;
}

function cloneMobileRailLoop_(el) {
  if (el.dataset.railCloned === '1') return el.scrollWidth / 2;
  var items = Array.prototype.slice.call(el.children);
  if (items.length < 2 || items.length > 6) return 0;
  items.forEach(function(node) {
    el.appendChild(node.cloneNode(true));
  });
  el.dataset.railCloned = '1';
  return el.scrollWidth / 2;
}

function initMobileRailAutoplay_(root, selector) {
  stopMobileRailAutoplay_();
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(max-width:900px)').matches) return;

  var nodes = root.querySelectorAll(selector || '.lw-grid, .lg-work-grid');
  var entries = [];
  nodes.forEach(function(el) {
    if (el.scrollWidth <= el.clientWidth + 4) return;
    var loopWidth = cloneMobileRailLoop_(el);
    if (!loopWidth) return;
    el.classList.add('is-rail-autoplay');

    var entry = {
      el: el,
      visible: true,
      scrollPos: el.scrollLeft || 0,
      loopWidth: loopWidth
    };

    entry.syncPos_ = function() {
      var loopW = entry.loopWidth;
      if (!loopW) return;
      entry.scrollPos = entry.el.scrollLeft % loopW;
      if (entry.scrollPos < 0) entry.scrollPos += loopW;
    };

    entries.push(entry);
  });

  if (!entries.length) return;

  var speed = 54;
  var lastTs = 0;
  var frozen = false;
  var idleTimer = null;
  var lastDriveTs = 0;
  var IDLE_MS = 4200;

  function freezeRail_() {
    frozen = true;
    if (_mobileRailAuto && _mobileRailAuto.raf) {
      cancelAnimationFrame(_mobileRailAuto.raf);
      _mobileRailAuto.raf = 0;
    }
    clearTimeout(idleTimer);
  }

  function scheduleUnfreezeRail_() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function() {
      if (!_mobileRailAuto) return;
      entries.forEach(function(entry) { entry.syncPos_(); });
      frozen = false;
      lastTs = 0;
      _mobileRailAuto.raf = requestAnimationFrame(tick);
    }, IDLE_MS);
  }

  function tick(ts) {
    if (!_mobileRailAuto || frozen) return;
    if (!lastTs) lastTs = ts;
    var dt = Math.min(Math.max(ts - lastTs, 0), 32);
    lastTs = ts;
    var delta = (speed * dt) / 1000;

    if (document.visibilityState === 'visible') {
      entries.forEach(function(entry) {
        if (!entry.visible) return;
        var el = entry.el;
        var loopW = entry.loopWidth;
        if (!loopW) return;
        entry.scrollPos += delta;
        while (entry.scrollPos >= loopW) entry.scrollPos -= loopW;
        lastDriveTs = performance.now();
        el.scrollLeft = entry.scrollPos;
      });
    }

    _mobileRailAuto.raf = requestAnimationFrame(tick);
  }

  entries.forEach(function(entry) {
    entry.onTouchStart_ = function() { freezeRail_(); };
    entry.onTouchMove_ = function() { freezeRail_(); };
    entry.onTouchEnd_ = function() {
      entry.syncPos_();
      freezeRail_();
      scheduleUnfreezeRail_();
    };
    entry.onPointerDown_ = function(e) {
      if (e.pointerType === 'mouse') return;
      freezeRail_();
    };
    entry.onScroll_ = function() {
      if (performance.now() - lastDriveTs < 80) return;
      entry.syncPos_();
      freezeRail_();
      scheduleUnfreezeRail_();
    };

    entry.el.addEventListener('touchstart', entry.onTouchStart_, { passive: true, capture: true });
    entry.el.addEventListener('touchmove', entry.onTouchMove_, { passive: true, capture: true });
    entry.el.addEventListener('touchend', entry.onTouchEnd_, { passive: true, capture: true });
    entry.el.addEventListener('touchcancel', entry.onTouchEnd_, { passive: true, capture: true });
    entry.el.addEventListener('pointerdown', entry.onPointerDown_, { capture: true });
    entry.el.addEventListener('scroll', entry.onScroll_, { passive: true });

    if ('IntersectionObserver' in window) {
      entry.io = new IntersectionObserver(function(obs) {
        entry.visible = obs[0].isIntersecting;
      }, { threshold: 0.12 });
      entry.io.observe(entry.el);
    }
  });

  _mobileRailAuto = {
    entries: entries,
    raf: 0,
    idleTimer: null,
    tick: tick,
    freeze: freezeRail_,
    scheduleUnfreeze: scheduleUnfreezeRail_
  };
  _mobileRailAuto.raf = requestAnimationFrame(tick);
}

function scheduleMobileRailAutoplay_() {
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var gallery = document.getElementById('gallery');
      var home = document.getElementById('home');
      if (gallery && gallery.classList.contains('active')) {
        stopMobileRailAutoplay_();
        return;
      }
      if (home && home.classList.contains('active')) {
        initMobileRailAutoplay_(home, '.lg-work-grid');
      } else {
        stopMobileRailAutoplay_();
      }
    });
  });
}

if (!window._mobileRailResizeBound) {
  window._mobileRailResizeBound = true;
  window.addEventListener('resize', function() {
    clearTimeout(window._mobileRailResizeT);
    window._mobileRailResizeT = setTimeout(scheduleMobileRailAutoplay_, 220);
  });
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') scheduleMobileRailAutoplay_();
  });
}


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

function goToGasApp(page) {
  var url = gasAppUrl_(page || 'ops');
  if (!url) {
    alert('URL aplikasi belum di-set. Isi GAS_APP_URL di landing/config.js, lalu rebuild/deploy ulang.');
    return;
  }
  window.location.href = url;
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
});
