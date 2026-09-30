/* ============================================================================
   script.js — General interactions, animations & page rendering
   ---------------------------------------------------------------------------
   Order of load:
     1. style.css
     2. products.js   (catalogue data)
     3. cart.js       (cart engine)
     4. script.js     (this file — everything else)
   Vanilla ES5+/ES6, no dependencies. Every observer degrades gracefully.
   ========================================================================== */

(function () {
  'use strict';

  const $  = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════════════════════
     1. IMAGES — graceful fallback to the branded placeholder block
     ════════════════════════════════════════════════════════════════════ */
  function guardImages(root) {
    $$('img', root || document).forEach(im => {
      if (im.dataset.guarded) return;
      im.dataset.guarded = '1';
      im.addEventListener('error', function () {
        const ph = im.closest('.ph');
        if (ph) ph.classList.add('ph--empty');
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     2. HEADER — transparent over the hero, solid once scrolled
     ════════════════════════════════════════════════════════════════════ */
  function initHeader() {
    const hdr = $('.hdr');
    if (!hdr) return;
    const onScroll = () => hdr.classList.toggle('is-solid', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════════════════
     3. MOBILE MENU — slide-in panel + body scroll lock
     ════════════════════════════════════════════════════════════════════ */
  function initMenu() {
    const burger = $('.burger');
    const menu   = $('.mmenu');
    if (!burger || !menu) return;

    const setOpen = open => {
      burger.classList.toggle('is-open', open);
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    };

    burger.addEventListener('click', () =>
      setOpen(!menu.classList.contains('is-open')));

    $$('.mmenu__a, .mmenu__foot a', menu).forEach(a =>
      a.addEventListener('click', () => setOpen(false)));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Reset if we resize up into desktop layout
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024) setOpen(false);
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     4. SCROLL REVEALS — IntersectionObserver, staggered via --i
     ════════════════════════════════════════════════════════════════════ */
  function initReveals() {
    const items = $$('[data-reveal]');

    // ── Horizontal rails first ──────────────────────────────────────────
    // Cards inside .coll / .rail sit off-screen to the RIGHT, so a
    // viewport-rooted IntersectionObserver never intersects them and they
    // would stay stuck at opacity 0. Reveal the whole rail the moment the
    // rail itself scrolls into view instead.
    const railItems = items.filter(el => el.closest('.coll, .rail'));
    if (railItems.length) {
      const rails = [];
      railItems.forEach(el => {
        const r = el.closest('.coll, .rail');
        if (rails.indexOf(r) === -1) rails.push(r);
      });
      const revealRail = rail => {
        $$('[data-reveal]', rail).forEach((c, i) => {
          if (!c.style.getPropertyValue('--i')) c.style.setProperty('--i', i % 6);
          c.classList.add('is-in');
        });
      };
      if (!('IntersectionObserver' in window) || REDUCED) {
        rails.forEach(revealRail);
      } else {
        const rio = new IntersectionObserver((entries, obs) => {
          entries.forEach(e => {
            if (!e.isIntersecting) return;
            revealRail(e.target);
            obs.unobserve(e.target);
          });
        }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
        rails.forEach(r => rio.observe(r));
      }
    }

    const rest = items.filter(el => !el.closest('.coll, .rail'));
    if (!rest.length) return;

    // Stagger siblings that live in the same parent
    const groups = {};
    rest.forEach(el => {
      const key = el.parentNode;
      (groups[key] = groups[key] || []).push(el);
    });
    Object.keys(groups).forEach(k => {
      groups[k].forEach((el, i) => {
        if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i % 8);
      });
    });

    if (!('IntersectionObserver' in window) || REDUCED) {
      rest.forEach(el => el.classList.add('is-in'));
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

    rest.forEach(el => io.observe(el));
  }

  /* ══════════════════════════════════════════════════════════════════════
     5. PARALLAX — hero / page-hero drift slower than the page
     ════════════════════════════════════════════════════════════════════ */
  function initParallax() {
    const layers = $$('[data-parallax]');
    if (!layers.length || REDUCED) return;

    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      layers.forEach(el => {
        const host = el.parentElement;
        const h = host.offsetHeight || 1;
        // clamp so the layer never reveals an edge, and stop once off-screen
        const p = Math.max(0, Math.min(1, y / h));
        const speed = parseFloat(el.dataset.parallax) || 0.28;
        el.style.transform = 'translate3d(0,' + (p * h * speed).toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ══════════════════════════════════════════════════════════════════════
     6. COUNTERS — count up once, when scrolled into view
        <b data-count="34.3" data-decimals="1" data-suffix="K+">0</b>
     ════════════════════════════════════════════════════════════════════ */
  function initCounters() {
    const nodes = $$('[data-count]');
    if (!nodes.length) return;

    const run = el => {
      const target   = parseFloat(el.dataset.count) || 0;
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const suffix   = el.dataset.suffix || '';
      const prefix   = el.dataset.prefix || '';
      const dur      = 1500;

      if (REDUCED) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }
      const t0 = performance.now();
      const step = now => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);           // easeOutCubic
        const val   = target * eased;
        el.textContent = prefix +
          (decimals ? val.toFixed(decimals) : Math.round(val).toString()) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    if (!('IntersectionObserver' in window)) { nodes.forEach(run); return; }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        run(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.5 });
    nodes.forEach(el => io.observe(el));
  }

  /* ══════════════════════════════════════════════════════════════════════
     7. STAR RATING REVEAL — fill in sequence when the reviews scroll in
     ════════════════════════════════════════════════════════════════════ */
  function initStars() {
    const sets = $$('.stars');
    if (!sets.length) return;
    const on = el => el.classList.add('is-on');

    if (!('IntersectionObserver' in window)) { sets.forEach(on); return; }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        on(e.target);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    sets.forEach(el => io.observe(el));
  }

  /* ══════════════════════════════════════════════════════════════════════
     8. PRODUCT CARD TEMPLATE — used by the featured rail + the shop grid
     ════════════════════════════════════════════════════════════════════ */
  function cardHTML(p, i) {
    const b = badgeOf(p);
    const badge = b
      ? '<span class="badge' + (b === 'Promo' ? ' badge--promo' : '') + '">' + b + '</span>'
      : '';
    const old = p.old ? '<s>' + priceFmt(p.old) + '</s>' : '';
    return '' +
      '<article class="pcard" data-reveal data-cat="' + p.cat + '"' +
        ' data-search="' + (p.name + ' ' + (p.note || '') + ' ' + p.cat).toLowerCase() + '"' +
        ' style="--i:' + i + '">' +
        '<div class="pcard__media">' +
          '<div class="ph"><img src="' + img(p.img) + '" alt="' + esc(p.name) +
            '" loading="lazy" width="600" height="800"></div>' +
          badge +
        '</div>' +
        '<div class="pcard__body">' +
          '<span class="pcard__cat">' + p.cat + '</span>' +
          '<h3 class="pcard__name">' + esc(p.name) + '</h3>' +
          (p.note ? '<p style="font-size:.78rem;color:var(--muted);margin-top:5px">' + esc(p.note) + '</p>' : '') +
          '<p class="pcard__price"><b>' + priceFmt(p.price) + '</b>' + old + '</p>' +
          '<button class="pcard__add" data-add="' + p.id + '" aria-label="Ajouter ' + esc(p.name) + ' au panier">' +
            '<span class="circ">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>' +
            '</span>' +
            '<span>Ajouter au panier</span>' +
          '</button>' +
        '</div>' +
      '</article>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  /** Render the featured rail (homepage) */
  function renderFeatured() {
    const host = $('#featured');
    if (!host) return;
    host.innerHTML = featuredProducts(6).map(cardHTML).join('');
    afterInject(host);
  }

  /** Render the full shop grid */
  function renderShop() {
    const host = $('#shopGrid');
    if (!host) return;
    host.innerHTML = PRODUCTS.map(cardHTML).join('');
    afterInject(host);
  }

  /** Any <img> that appears after boot() needs the same setup as the static
      ones: placeholder fallback + scroll-reveal observation. */
  function afterInject(host) {
    guardImages(host);
    initReveals();
  }

  /* ══════════════════════════════════════════════════════════════════════
     9. SHOP — category filter + search (pure client-side)
     ════════════════════════════════════════════════════════════════════ */
  function initShop() {
    const grid = $('#shopGrid');
    if (!grid) return;

    const chips  = $$('.chip');
    const input  = $('#q');
    const clear  = $('#qClear');
    const count  = $('#shopCount');
    const empty  = $('#shopEmpty');
    let cat = 'all';

    function apply() {
      const q = (input && input.value || '').trim().toLowerCase();
      let shown = 0;

      $$('.pcard', grid).forEach(card => {
        const okCat = cat === 'all' || card.dataset.cat === cat;
        const okQ   = !q || card.dataset.search.indexOf(q) > -1;
        const vis   = okCat && okQ;
        card.style.display = vis ? '' : 'none';
        if (vis) shown++;
      });

      if (count) count.textContent = shown + (shown > 1 ? ' pièces' : ' pièce');
      if (empty) empty.hidden = shown > 0;

      // Newly shown cards fade in
      if (!REDUCED) {
        $$('.pcard:not([style*="display: none"])', grid).forEach((c, i) => {
          c.style.animation = 'none'; void c.offsetWidth;
          c.style.animation = 'upIn .5s var(--ease) both';
          c.style.animationDelay = (i * 45) + 'ms';
        });
      }
    }

    chips.forEach(chip => chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-on'));
      chip.classList.add('is-on');
      cat = chip.dataset.filter;
      apply();
    }));

    if (input) input.addEventListener('input', () => {
      if (clear) clear.classList.toggle('is-on', input.value.length > 0);
      apply();
    });

    if (clear) clear.addEventListener('click', () => {
      input.value = ''; clear.classList.remove('is-on'); apply(); input.focus();
    });

    // Sort select
    const sort = $('#sort');
    if (sort) sort.addEventListener('change', () => {
      const cards = $$('.pcard', grid);
      const val = sort.value;
      cards.sort((a, b) => {
        const pa = +a.querySelector('.pcard__price b').textContent.replace(/\D/g, '');
        const pb = +b.querySelector('.pcard__price b').textContent.replace(/\D/g, '');
        if (val === 'asc')  return pa - pb;
        if (val === 'desc') return pb - pa;
        if (val === 'promo') return (b.classList.contains('badge--promo') ? 0 : 1)
                                    - (a.classList.contains('badge--promo') ? 0 : 1)
                                    || pb - pa;
        return 0;
      });
      cards.forEach(c => grid.appendChild(c));
      apply();
    });

    apply();
  }

  /* ══════════════════════════════════════════════════════════════════════
     10. FORMS — contact + newsletter (no backend: graceful client-side ack)
     ════════════════════════════════════════════════════════════════════ */
  function initForms() {
    const form = $('#contactForm');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const note = $('#formNote');
        const name = (form.querySelector('[name=name]') || {}).value;
        if (note) {
          note.classList.add('is-on');
          note.querySelector('span').textContent =
            'Merci ' + (name ? name + ' ' : '') + '— nous vous répondons sous 24h. Vous pouvez aussi nous écrire directement sur WhatsApp.';
        }
        form.reset();
      });
    }

    $$('[data-newsletter]').forEach(f => {
      f.addEventListener('submit', e => {
        e.preventDefault();
        const out = f.parentElement.querySelector('.nl__ok');
        if (out) { out.style.display = 'block'; f.reset(); }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     11. STICKY MOBILE BAR — appears once you leave the hero
     ════════════════════════════════════════════════════════════════════ */
  function initStickyBar() {
    const bar = $('.stickybar');
    if (!bar) return;
    document.body.classList.add('has-stickybar');
    const onScroll = () => {
      const show = window.scrollY > window.innerHeight * 0.55 && !RaniaCart.isOpen();
      bar.classList.toggle('is-on', show);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-cart-open]')) bar.classList.remove('is-on');
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     12. SMOOTH IN-PAGE SCROLL with header offset
     ════════════════════════════════════════════════════════════════════ */
  function initAnchors() {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top +
                  window.scrollY -
                  parseFloat(getComputedStyle(document.documentElement)
                    .getPropertyValue('--hdr')) - 18;
      window.scrollTo({ top, behavior: REDUCED ? 'auto' : 'smooth' });
      // keep focus for keyboard users without a jump
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     13. CURRENT YEAR in footers
     ════════════════════════════════════════════════════════════════════ */
  function initYear() {
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  }

  /* ══════════════════════════════════════════════════════════════════════
     BOOT
     ════════════════════════════════════════════════════════════════════ */
  function boot() {
    guardImages();
    initHeader();
    initMenu();
    renderFeatured();
    renderShop();
    initShop();
    initAnchors();
    initStickyBar();
    initForms();
    initYear();
    initReveals();
    initParallax();
    initCounters();
    initStars();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }

  // Expose the card template for any page that builds grids by hand
  window.RaniaUI = { cardHTML, esc };
})();