// ============================================
// KORE. — Animations Layer
// Scroll reveal · Float banner · Wave parallax · Custom cursor
// Drop this AFTER csv-loader.js and app.js in every HTML page
// ============================================

(function () {
  'use strict';

  /* ── 1. SCROLL REVEAL ──────────────────────────────────────── */
  function initScrollReveal() {
    // Auto-tag sections that should animate in
    const targets = document.querySelectorAll(
      'section, .plan-card, .story-card, .faves-section, .productivity-section, ' +
      '.testimonial-section, .tagline-section, .cta-band, .lab-promo, ' +
      '.product-page, .cart-page, .checkout-page, .subscribe-page, ' +
      '.community-hero, .plans-section, .success-section, .reddit-cta, ' +
      '.story-hero, .story-content, .story-disclaimer, .bot-section, .engine-section'
    );

    targets.forEach(el => {
      if (!el.classList.contains('reveal') && !el.classList.contains('reveal-stagger')) {
        el.classList.add('reveal');
      }
    });

    // Product grids get stagger
    document.querySelectorAll('.products-grid, .plans-grid, .shop-products-grid').forEach(el => {
      el.classList.add('reveal-stagger');
      el.classList.remove('reveal');
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            if (e.target.classList.contains('reveal-stagger')) {
              Array.from(e.target.children).forEach((child, i) => {
                child.style.transitionDelay = (i * 0.1) + 's';
              });
            }
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));
  }

  /* ── 2. FLOATING OBJECTS BANNER ────────────────────────────── */
  function buildFloatBanner() {
    // Collect product images (set by csv-loader) OR use emoji fallback
    const imgs = [];

    if (typeof products !== 'undefined' && products.length) {
      products.forEach(p => {
        if (p.mainImage) imgs.push({ src: `assets/objects/${p.mainImage}`, alt: p.name, id: p.id });
      });
    }

    // Always supplement with emoji fallbacks so the banner is never empty
    const emojiFallbacks = ['⚙️','🛠️','💊','🧬','🔮','📦','🌀','✨','🎯','🧠','💡','🔧','🎨','⭐'];
    const useEmoji = imgs.length < 4;

    // Build double-array for seamless loop
    const items = useEmoji
      ? [...emojiFallbacks, ...emojiFallbacks]
      : [...imgs, ...imgs];

    const banner = document.createElement('div');
    banner.className = 'float-banner';
    banner.setAttribute('aria-hidden', 'true');

    const track = document.createElement('div');
    track.className = 'float-track';

    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'float-item';

      if (typeof item === 'string') {
        // emoji
        el.innerHTML = `<span class="float-emoji">${item}</span>`;
      } else {
        const img = document.createElement('img');
        img.src = item.src;
        img.alt = item.alt;
        img.loading = 'lazy';
        img.onerror = function () {
          this.parentElement.innerHTML = `<span class="float-emoji">⚙️</span>`;
        };
        if (item.id) {
          el.style.cursor = 'pointer';
          el.onclick = () => { window.location.href = `product.html?id=${item.id}`; };
        }
        el.appendChild(img);
      }

      track.appendChild(el);
    });

    banner.appendChild(track);
    return banner;
  }

  /* function injectFloatBanner() {
    // Insert after the first ticker pair (after the first .ticker-white on each page)
    const anchor = document.querySelector('.ticker-wrap.ticker-white');
    if (anchor && anchor.parentNode) {
      const banner = buildFloatBanner();
      anchor.parentNode.insertBefore(banner, anchor.nextSibling);
    }
  } */

  /* ── 3. WAVE SVG MOUSE PARALLAX ────────────────────────────── */
  function initWaveParallax() {
    const waveContainer = document.querySelector('.wave-container');
    if (!waveContainer) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = (e.clientX - cx) / cx * 18;   // ±18px horizontal
      targetY = (e.clientY - cy) / cy * 20;   // ±10px vertical
    });

    function animateWave() {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      waveContainer.style.transform = `translateY(${currentY}px)`;
      requestAnimationFrame(animateWave);
    }
    animateWave();
  }

  /* ── 4. CUSTOM CURSOR ───────────────────────────────────────── */
  function initCustomCursor() {
    // Only on pointer-device screens
    if (window.matchMedia('(hover: none)').matches) return;

    const cursor = document.createElement('div');
    cursor.id = 'kore-cursor';
    document.body.appendChild(cursor);

    let mouseX = -100, mouseY = -100;
    let curX = -100, curY = -100;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth follow
    function moveCursor() {
      curX += (mouseX - curX) * 0.14;
      curY += (mouseY - curY) * 0.14;
      cursor.style.left = curX + 'px';
      cursor.style.top  = curY + 'px';
      requestAnimationFrame(moveCursor);
    }
    moveCursor();

    // Expand on interactive elements
    const expandTargets = 'a, button, .product-card, .float-item, .plan-card, .filter-btn, .reddit-post, .product-thumb';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(expandTargets)) cursor.classList.add('expanded');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(expandTargets)) cursor.classList.remove('expanded');
    });

    // Hide when leaving window
    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
  }

  /* ── 5. NAVBAR SCROLL SHADOW ────────────────────────────────── */
  function initNavbarScroll() {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
      } else {
        nav.style.boxShadow = 'none';
      }
    }, { passive: true });
  }

  /* ── 6. BUTTON RIPPLE ───────────────────────────────────────── */
  function initRipple() {
    document.querySelectorAll('.btn-orange, .btn-outline, .btn-white, .btn-run, .btn-add-cart').forEach(btn => {
      btn.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.5;
        ripple.style.cssText = `
          position:absolute; border-radius:50%;
          width:${size}px; height:${size}px;
          left:${e.clientX - rect.left - size/2}px;
          top:${e.clientY - rect.top - size/2}px;
          background:rgba(255,255,255,0.35);
          transform:scale(0); animation:rippleAnim 0.5s ease-out forwards;
          pointer-events:none;
        `;
        // Ensure parent has relative position (buttons already do)
        if (getComputedStyle(this).position === 'static') this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
      });
    });

    // Inject ripple keyframe once
    if (!document.getElementById('ripple-style')) {
      const s = document.createElement('style');
      s.id = 'ripple-style';
      s.textContent = `@keyframes rippleAnim{to{transform:scale(1);opacity:0}}`;
      document.head.appendChild(s);
    }
  }

  /* ── 7. SEAMLESS TICKERS ────────────────────────────────────── */
  function initTickers() {
    document.querySelectorAll('.ticker').forEach(ticker => {
      const isRight = ticker.classList.contains('ticker-right');

      // Keep first span only, remove others (including any text nodes)
      const spans = Array.from(ticker.children).filter(el => el.tagName === 'SPAN');
      if (!spans.length) return;
      const source = spans[0];
      spans.slice(1).forEach(s => s.remove());

      // Remove padding-right : c'est lui qui crée l'espace plus large entre les deux spans
      // Le séparateur vient du contenu texte lui-même (espace final de chaque répétition)
      source.style.paddingRight = '0';

      const clone = source.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      ticker.appendChild(clone);

      // Lire la durée CSS avant de la couper
      const dur = parseFloat(getComputedStyle(ticker).animationDuration) || 18;
      ticker.style.animation = 'none';
      ticker.style.willChange = 'transform';

      let pos = 0;
      let pxPerMs = 0;
      let w = 0;
      let lastTs = null;

      function step(ts) {
        if (!w) {
          // getBoundingClientRect = précision sub-pixel, pas d'arrondi comme offsetWidth
          w = source.getBoundingClientRect().width;
          if (!w) { requestAnimationFrame(step); return; }
          pxPerMs = w / (dur * 1000);
          if (isRight) pos = -w;
          lastTs = ts;
          requestAnimationFrame(step);
          return;
        }

        const delta = pxPerMs * (ts - lastTs);
        lastTs = ts;
        pos += isRight ? delta : -delta;

        // Wrap dans le même frame → pas de saut visible
        if (pos <= -w) pos += w;
        if (pos >= 0 && isRight) pos -= w;

        ticker.style.transform = `translate3d(${Math.round(pos)}px,0,0)`;
        requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    });
  }

  /* ── INIT ────────────────────────────────────────────────────── */
  function initAnimations() {
    initTickers();
    initScrollReveal();
    initNavbarScroll();
    initWaveParallax();
    initCustomCursor();
    initRipple();

    // Float banner: inject after data is ready (products may already be loaded)
    if (typeof products !== 'undefined' && products.length) {
      injectFloatBanner();
    } else {
      // No products yet — inject with emoji, or wait for onDataReady
      const originalOnDataReady = window.onDataReady;
      window.onDataReady = function () {
        if (typeof originalOnDataReady === 'function') originalOnDataReady();
        injectFloatBanner();
      };
      // Fallback: inject with emojis after 1.5s if onDataReady never fires
      setTimeout(() => {
        if (!document.querySelector('.float-banner')) injectFloatBanner();
      }, 1500);
    }
  }

  // Run on DOMContentLoaded (after app.js has registered its own listener)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }

})();
