/* ============================================================================
   cart.js — Cart engine (localStorage + bottom-sheet/drawer + WhatsApp order)
   ---------------------------------------------------------------------------
   Loaded on every page, immediately after products.js. Requires:
     · products.js  (PRODUCTS, getProduct, img, priceFmt, badgeOf)
   Injects its own markup into <body>, so there is no cart HTML to duplicate
   across the five pages.

   PUBLIC API (used by script.js / inline handlers):
     RaniaCart.add(product, qty)   add a line + micro-interaction + toast
     RaniaCart.open() / .close()  toggle the sheet
     RaniaCart.count()            total number of items
     RaniaCart.total()            grand total in MAD
   ========================================================================== */

const RaniaCart = (function () {
  'use strict';

  /* ── CONFIG ──────────────────────────────────────────────────────────── */
  const STORE_KEY = 'rania_shop_cart_v1';
  const WHATSAPP  = '212646263259';                       // 06 46 26 32 59
  const CURRENCY  = 'DH';

  /* ── STATE ───────────────────────────────────────────────────────────── */
  let lines = load();          // [{ id, qty }]  ← only refs are persisted
  let lastFocused = null;

  /* ── PERSISTENCE ─────────────────────────────────────────────────────── */
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // drop anything that no longer exists in the catalogue
      return parsed
        .filter(l => l && typeof l.id === 'string' && getProduct(l.id))
        .map(l => ({ id: l.id, qty: Math.max(1, Math.min(99, parseInt(l.qty, 10) || 1)) }));
    } catch (e) {
      return [];
    }
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(lines)); }
    catch (e) { /* private mode — cart still works for the session */ }
  }

  /* ── DERIVED ─────────────────────────────────────────────────────────── */
  function count() { return lines.reduce((n, l) => n + l.qty, 0); }
  function total() { return lines.reduce((s, l) => s + lineTotal(l), 0); }
  function lineTotal(l) { const p = getProduct(l.id); return p ? p.price * l.qty : 0; }

  /* ── MARKUP ──────────────────────────────────────────────────────────── */
  const ICON = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    wa:   '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.96-.94 1.16c-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37s-1.04 1.01-1.04 2.47 1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.36c0-4.53 3.69-8.22 8.23-8.22 2.2 0 4.26.86 5.82 2.41a8.16 8.16 0 0 1 2.41 5.82c0 4.54-3.69 8.21-8.23 8.21z"/></svg>'
  };

  function shell() {
    if (document.getElementById('cartRoot')) return;

    const wrap = document.createElement('div');
    wrap.id = 'cartRoot';
    wrap.innerHTML =
      '<div class="cbd" id="cbd" hidden></div>' +
      '<aside class="cart" id="cart" role="dialog" aria-modal="true" aria-label="Panier" hidden>' +
        '<div class="cart__grip"></div>' +
        '<header class="cart__head">' +
          '<h2 class="cart__title">Votre panier<span id="cartCountLbl">0 article</span></h2>' +
          '<button class="cart__close" id="cartClose" aria-label="Fermer le panier">' + ICON.close + '</button>' +
        '</header>' +
        '<div class="cart__list" id="cartList"></div>' +
        '<div class="cart__foot" id="cartFoot">' +
          '<div class="cart__sum"><span>Sous-total</span><b id="cartTotal">0 ' + CURRENCY + '</b></div>' +
          '<p class="cart__ship">Livraison offerte dès 500 DH · Paiement à la livraison</p>' +
          '<button class="btn cart__wa" id="cartWa">' + ICON.wa + '<span>Commander via WhatsApp</span></button>' +
          '<a class="btn btn--ghost btn--sm cart__view" href="shop.html">Continuer mes achats</a>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(wrap);
  }

  /* ── TOAST ───────────────────────────────────────────────────────────── */
  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.innerHTML = ICON.check + '<span></span>';
      document.body.appendChild(t);
    }
    t.querySelector('span').textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  function render() {
    const list  = document.getElementById('cartList');
    const foot  = document.getElementById('cartFoot');
    if (!list) return;

    if (!lines.length) {
      list.innerHTML =
        '<div class="cart__empty">' + ICON.bag +
        '<p class="h3">Votre panier est vide</p>' +
        '<p>Parcourez la collection et ajoutez vos coups de cœur.</p>' +
        '<a class="btn btn--sm" href="shop.html" style="margin-top:6px">Voir la collection</a>' +
        '</div>';
      foot.hidden = true;
    } else {
      list.innerHTML = lines.map(l => {
        const p = getProduct(l.id);
        if (!p) return '';
        return '<article class="citem" data-id="' + p.id + '">' +
          '<div class="ph citem__ph"><img src="' + img(p.img, 240) + '" alt="' + esc(p.name) + '" loading="lazy"></div>' +
          '<div class="citem__body">' +
            '<h3 class="citem__n">' + esc(p.name) + '</h3>' +
            '<span class="citem__p">' + priceFmt(p.price) + ' / pièce</span>' +
            '<div class="citem__row">' +
              '<div class="qty">' +
                '<button data-act="dec" aria-label="Diminuer la quantité">' + ICON.minus + '</button>' +
                '<span>' + l.qty + '</span>' +
                '<button data-act="inc" aria-label="Augmenter la quantité">' + ICON.plus + '</button>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:8px">' +
                '<b style="font-family:var(--ff-display);font-weight:400;font-size:1.05rem">' + priceFmt(lineTotal(l)) + '</b>' +
                '<button class="citem__rm" data-act="rm" aria-label="Retirer">' + ICON.trash + '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</article>';
      }).join('');
      foot.hidden = false;
      const n = count();
      document.getElementById('cartCountLbl').textContent =
        n + (n > 1 ? ' articles' : ' article');
      document.getElementById('cartTotal').textContent = priceFmt(total());
    }
    paintBadge();
  }

  /* ── BADGE + BUTTON MICRO-INTERACTION ────────────────────────────────── */
  function paintBadge(pulse) {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      const n = count();
      el.textContent = n > 99 ? '99+' : n;
      el.classList.toggle('is-on', n > 0);
      if (pulse && n > 0) {
        el.classList.remove('pulse');
        void el.offsetWidth;                       // restart the animation
        el.classList.add('pulse');
      }
    });
    document.querySelectorAll('.cart-btn').forEach(b => {
      if (!pulse) return;
      b.classList.remove('bounce');
      void b.offsetWidth;
      b.classList.add('bounce');
      setTimeout(() => b.classList.remove('bounce'), 700);
    });
  }

  /* ── MUTATIONS ───────────────────────────────────────────────────────── */
  function add(product, qty) {
    if (!product) return;
    const q = Math.max(1, parseInt(qty, 10) || 1);
    const found = lines.find(l => l.id === product.id);
    if (found) found.qty = Math.min(99, found.qty + q);
    else lines.push({ id: product.id, qty: Math.min(99, q) });
    save();
    render();
    paintBadge(true);
    toast(product.name + ' ajouté au panier');
    feedback(product.id);
  }

  function setQty(id, qty) {
    const l = lines.find(x => x.id === id);
    if (!l) return;
    l.qty = Math.max(1, Math.min(99, qty));
    save();
    render();
  }

  function remove(id, animate) {
    if (animate) {
      const node = document.querySelector('.citem[data-id="' + id + '"]');
      if (node) {
        node.classList.add('is-out');
        setTimeout(() => { lines = lines.filter(l => l.id !== id); save(); render(); }, 300);
        return;
      }
    }
    lines = lines.filter(l => l.id !== id);
    save();
    render();
  }

  /** Brief check-mark swap on the product card that was just added. */
  function feedback(id) {
    document.querySelectorAll('.pcard__add[data-add="' + id + '"]').forEach(btn => {
      const label = btn.querySelector('span:not(.circ)');   // skip the icon circle
      if (!label) return;
      const prev = label.textContent;
      btn.classList.add('is-added');
      label.textContent = 'Ajouté ✓';
      clearTimeout(btn._t);
      btn._t = setTimeout(() => { btn.classList.remove('is-added'); label.textContent = prev; }, 1800);
    });
  }

  /* ── WHATSAPP ORDER ──────────────────────────────────────────────────── */
  function whatsappMessage() {
    const head = 'Bonjour Rania Shop, je souhaite commander :';
    const body = lines.map(l => {
      const p = getProduct(l.id);
      if (!p) return '';
      return '• ' + p.name + ' (x' + l.qty + ') — ' + priceFmt(lineTotal(l));
    }).filter(Boolean).join('\n');
    const tail = 'Total : ' + priceFmt(total());
    return [head, body, tail, 'Livraison :'].join('\n');
  }

  function orderWhatsApp() {
    if (!lines.length) return;
    const url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(whatsappMessage());
    window.open(url, '_blank', 'noopener');
  }

  /* ── OPEN / CLOSE ────────────────────────────────────────────────────── */
  function open() {
    render();
    const cart = document.getElementById('cart');
    const cbd  = document.getElementById('cbd');
    if (!cart) return;
    lastFocused = document.activeElement;
    cart.hidden = false; cbd.hidden = false;
    // force reflow so the transition actually runs from the off-screen state
    void cart.offsetWidth;
    cart.classList.add('is-on');
    cbd.classList.add('is-on');
    document.body.classList.add('is-locked');
    document.getElementById('cartClose').focus();
  }

  function close() {
    const cart = document.getElementById('cart');
    const cbd  = document.getElementById('cbd');
    if (!cart) return;
    cart.classList.remove('is-on');
    cbd.classList.remove('is-on');
    document.body.classList.remove('is-locked');
    setTimeout(() => {
      if (!cart.classList.contains('is-on')) { cart.hidden = true; cbd.hidden = true; }
    }, 600);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  const isOpen = () => document.getElementById('cart').classList.contains('is-on');

  /* ── EVENT WIRING ────────────────────────────────────────────────────── */
  function bind() {
    // Any element with data-cart-open opens the sheet
    document.addEventListener('click', e => {
      const opener = e.target.closest('[data-cart-open]');
      if (opener) { e.preventDefault(); open(); return; }

      // Delegated controls inside the sheet
      const ctl = e.target.closest('#cartList [data-act]');
      if (ctl) {
        const id = ctl.closest('.citem').dataset.id;
        const l = lines.find(x => x.id === id);
        if (!l) return;
        if (ctl.dataset.act === 'inc') setQty(id, l.qty + 1);
        if (ctl.dataset.act === 'dec') l.qty <= 1 ? remove(id, true) : setQty(id, l.qty - 1);
        if (ctl.dataset.act === 'rm') remove(id, true);
        return;
      }

      // Any element with data-add="<productId>" adds to cart
      const adder = e.target.closest('[data-add]');
      if (adder) { e.preventDefault(); add(getProduct(adder.dataset.add)); }
    });

    document.getElementById('cartClose').addEventListener('click', close);
    document.getElementById('cbd').addEventListener('click', close);
    document.getElementById('cartWa').addEventListener('click', orderWhatsApp);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen()) close();
    });

    // Keep multiple open tabs in sync
    window.addEventListener('storage', e => {
      if (e.key === STORE_KEY) { lines = load(); render(); }
    });
  }

  /* ── UTIL ────────────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  /* ── INIT ────────────────────────────────────────────────────────────── */
  function init() {
    shell();
    bind();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  return { add, open, close, count, total, isOpen, orderWhatsApp, whatsappMessage };
})();