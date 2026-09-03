
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
