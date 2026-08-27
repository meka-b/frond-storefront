/* ============================================================
   FROND  theme.js
   Vanilla Web Components + micro-interactions (no framework)
   ============================================================ */
'use strict';

/* ---------- helpers ---------- */
const qs  = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const debounce = (fn, ms = 220) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* catalog data lives in data.js (loaded before this file) */

/* ============================================================
   2. CART STORE  (tiny event-driven store, localStorage persisted)
   ============================================================ */
const getFreeShipThreshold = () => (typeof SITE_SETTINGS !== 'undefined' && SITE_SETTINGS.free_shipping_threshold) || 7500;
const Cart = {
  key: 'frond_cart_v1',
  items: [],
  load() { try { this.items = JSON.parse(localStorage.getItem(this.key)) || []; } catch { this.items = []; } },
  save() {
    localStorage.setItem(this.key, JSON.stringify(this.items));
    document.dispatchEvent(new CustomEvent('cart:updated'));
  },
  add(variantId, qty = 1) {
    const line = this.items.find(i => i.variantId === variantId);
    if (line) line.qty += qty; else this.items.push({ variantId, qty });
    this.save();
  },
  setQty(variantId, qty) {
    const line = this.items.find(i => i.variantId === variantId);
    if (!line) return;
    line.qty = qty;
    if (line.qty <= 0) this.items = this.items.filter(i => i !== line);
    this.save();
  },
  remove(variantId) { this.items = this.items.filter(i => i.variantId !== variantId); this.save(); },
  clear() { this.items = []; this.save(); },
  count() { return this.items.reduce((n, i) => n + i.qty, 0); },
  total() {
    return this.items.reduce((sum, i) => {
      const hit = findVariant(i.variantId);
      return hit ? sum + hit.variant.price * i.qty : sum;
    }, 0);
  }
};
Cart.load();
document.addEventListener('cart:add', e => {
  Cart.add(e.detail.variantId, e.detail.qty || 1);
  qs('cart-drawer').open();
});

/* header cart badge */
function syncBadge() {
  const b = qs('.cart-count');
  b.textContent = Cart.count();
  b.classList.toggle('on', Cart.count() > 0);
}

/* ============================================================
   3. <reveal-text>  masked word/char stagger (kinetic type)
   ============================================================ */
class RevealText extends HTMLElement {
  connectedCallback() {
    const mode = this.getAttribute('split') || 'words';
    const text = this.textContent.trim().replace(/\s+/g, ' ');
    const tokens = mode === 'chars' ? text.split('') : text.split(' ');
    this.setAttribute('aria-label', text);
    this.textContent = '';
    let i = 0;
    tokens.forEach(tok => {
      const mask = document.createElement('span');
      mask.className = 'w'; mask.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.className = 'wi';
      inner.style.setProperty('--i', i++);
      inner.innerHTML = tok === ' ' ? '&nbsp;' : tok;
      mask.appendChild(inner);
      this.appendChild(mask);
      if (mode === 'words') this.appendChild(document.createTextNode(' '));
    });
    RevealText.io.observe(this);
  }
  disconnectedCallback() { RevealText.io.unobserve(this); }
}
RevealText.io = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); RevealText.io.unobserve(en.target); } });
}, { threshold: 0.35 });
customElements.define('reveal-text', RevealText);

/* generic [data-reveal] on-scroll reveal */
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
function initReveals(root = document) { qsa('[data-reveal]', root).forEach(el => revealIO.observe(el)); }

/* ============================================================
   4. <marquee-band>  seamless infinite ticker
   ============================================================ */
class MarqueeBand extends HTMLElement {
  connectedCallback() {
    const speed = this.getAttribute('speed') || '32s';
    const content = this.innerHTML;
    this.innerHTML = '';
    const mq = document.createElement('div'); mq.className = 'mq';
    const track = document.createElement('div'); track.className = 'mq-track';
    track.style.setProperty('--speed', speed);
    const group = document.createElement('div'); group.className = 'mq-group';
    group.innerHTML = content;
    track.appendChild(group);
    mq.appendChild(track);
    this.appendChild(mq);
    /* make one group at least viewport-width, then duplicate for the -50% loop */
    const fill = () => {
      let guard = 0;
      while (group.scrollWidth < this.offsetWidth * 1.1 && guard++ < 12) group.innerHTML += content;
      const clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    };
    fill();
    addEventListener('resize', debounce(() => {
      track.innerHTML = '';
      const g = group.cloneNode(false);
      g.innerHTML = content;
      track.appendChild(g);
      let guard = 0;
      while (g.scrollWidth < this.offsetWidth * 1.1 && guard++ < 12) g.innerHTML += content;
      const c = g.cloneNode(true); c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    }, 300));
  }
}
customElements.define('marquee-band', MarqueeBand);

/* ============================================================
   5. <variant-radios>  dynamic variant picker
   Emits: variant:change {detail {product, variant}}
   ============================================================ */
class VariantRadios extends HTMLElement {
  connectedCallback() { this.render(); }
  render() {
    const p = findProduct(this.getAttribute('product'));
    if (!p || !Array.isArray(p.variants) || p.variants.length === 0) {
      this.innerHTML = '';
      this.style.display = 'none';
      return;
    }

    // If product has only 1 variant labeled 'Standard' or 'Default' or empty, hide the variant picker
    if (p.variants.length === 1 && (!p.variants[0].label || p.variants[0].label.toLowerCase() === 'standard' || p.variants[0].label.toLowerCase() === 'default' || p.variants[0].label.toLowerCase() === 'varsayılan')) {
      this.innerHTML = '';
      this.style.display = 'none';
      this.dataset.selected = p.variants[0].id;
      return;
    }

    this.style.display = '';
    let selected = p.variants.findIndex(v => v.available);
    if (selected < 0) selected = 0;
    this.dataset.selected = p.variants[selected].id;

    const style = p.optionStyle || 'swatch';
    this.innerHTML = `
      <p class="vr-label">${p.optionName || 'Option'}  <b>${p.variants[selected].label}</b></p>
      <div class="vr-row" role="group" aria-label="${p.optionName || 'Option'}">
        ${p.variants.map((v, i) => style === 'pill'
          ? `<button type="button" class="vr-pill ${v.available ? '' : 'na'}" data-i="${i}" aria-pressed="${i === selected}">${v.label}</button>`
          : `<button type="button" class="vr-swatch ${v.available ? '' : 'na'}" data-i="${i}"
               style="--hex:${v.hex || '#D8D2C4'}" title="${v.label}${v.available ? '' : '  sold out'}"
               aria-label="${v.label}${v.available ? '' : ', sold out'}" aria-pressed="${i === selected}"></button>`
        ).join('')}
      </div>`;

    this.addEventListener('click', e => {
      const btn = e.target.closest('[data-i]');
      if (!btn) return;
      const i = +btn.dataset.i, v = p.variants[i];
      if (!v || !v.available) return;
      this.dataset.selected = v.id;
      qs('.vr-label b', this).textContent = v.label;
      qsa('[data-i]', this).forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      this.dispatchEvent(new CustomEvent('variant:change', { bubbles: true, detail: { product: p, variant: v } }));
    });
  }
}
customElements.define('variant-radios', VariantRadios);

/* ============================================================
   6. <product-card>  hover swap, floating quick-add
   ============================================================ */
class ProductCard extends HTMLElement {
  static get observedAttributes() { return ['product']; }
  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'product' && oldVal !== newVal) {
      this.render();
    }
  }
  connectedCallback() {
    this.render();
    if (!this._catalogListener) {
      this._catalogListener = () => this.render();
      document.addEventListener('catalog:live', this._catalogListener);
    }
  }
  disconnectedCallback() {
    if (this._catalogListener) {
      document.removeEventListener('catalog:live', this._catalogListener);
    }
  }
  render() {
    const pid = this.getAttribute('product');
    if (!pid) return;
    const p = findProduct(pid);
    if (!p) return;
    const v0 = (p.variants && p.variants.find(v => v.available)) || (p.variants && p.variants[0]) || { price: 4800, compareAt: null, available: true, id: `${p.id}-std` };
    const ctaBase = this.getAttribute('cta-label') || 'Quick add';
    const mainImg = p.images?.[0] || '/assets/img/p-monstera-1.jpg';
    const hoverImg = p.images?.[1] || mainImg;

    this.innerHTML = `
      <figure class="pc-media">
        ${p.badge ? `<span class="pc-badge ${p.badgeCls || ''}">${p.badge}</span>` : ''}
        <a class="img-link" href="${getProductUrl(p)}" aria-label="${p.title}">
          <img class="img-main" src="${mainImg}" alt="${p.title}" loading="lazy" decoding="async" width="600" height="750">
          <img class="img-hover" src="${hoverImg}" alt="" aria-hidden="true" loading="lazy" decoding="async" width="600" height="750">
        </a>
        <button type="button" class="pc-quick" data-quick>${ctaBase} <span aria-hidden="true">+</span></button>
      </figure>
      <div class="pc-info">
        <div class="pc-row">
          <h3 class="pc-title"><a href="${getProductUrl(p)}">${p.title}</a></h3>
          <p class="pc-price">${v0.compareAt ? `<span class="from"></span>` : ''}<span class="val">${money(v0.price)}</span>${v0.compareAt ? `<s>${money(v0.compareAt)}</s>` : ''}</p>
        </div>
        <variant-radios product="${p.id}"></variant-radios>
      </div>`;

    const priceEl = qs('.pc-price', this);
    const quick = qs('[data-quick]', this);
    let current = v0;

    const sync = v => {
      current = v;
      if (priceEl) priceEl.innerHTML = `<span class="val">${money(v.price)}</span>${v.compareAt ? `<s>${money(v.compareAt)}</s>` : ''}`;
      if (quick) {
        quick.disabled = !v.available;
        quick.innerHTML = v.available ? `${ctaBase} <span aria-hidden="true">+</span>` : 'Sold out';
      }
    };
    this.addEventListener('variant:change', e => sync(e.detail.variant));

    if (quick) {
      quick.addEventListener('click', e => {
        e.preventDefault();
        if (!current.available) return;
        document.dispatchEvent(new CustomEvent('cart:add', { detail: { variantId: current.id } }));
        quick.classList.add('added');
        quick.innerHTML = 'Added ✓';
        setTimeout(() => { quick.classList.remove('added'); sync(current); }, 1300);
      });
    }
  }
}
customElements.define('product-card', ProductCard);

/* ============================================================
   7. Drawer plumbing  inert page state, focus trap, ESC
   ============================================================ */
function focusables(root) {
  return qsa('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', root)
    .filter(el => el.offsetParent !== null);
}
function setPageInert(except) {
  qsa('body > *').forEach(el => { if (el !== except) el.inert = true; });
}
function clearPageInert() { qsa('body > *').forEach(el => { el.inert = false; }); }

class BaseDrawer extends HTMLElement {
  connectedCallback() {
    this.classList.add('drawer');
    if (this.hasAttribute('left')) this.classList.add('left');
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'true');
    this.setAttribute('aria-hidden', 'true');
    this.addEventListener('click', e => {
      if (e.target.closest('[data-close]') || e.target.classList.contains('drawer-backdrop')) this.close();
    });
    document.addEventListener('keydown', e => {
      if (!this.classList.contains('open')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'Tab') {
        const f = focusables(this);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    });
  }
  open() {
    this._returnFocus = document.activeElement;
    this.classList.add('open');
    this.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('no-scroll');
    setPageInert(this);
    const f = focusables(this);
    if (f.length) f[0].focus({ preventScroll: true });
  }
  close() {
    this.classList.remove('open');
    this.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('no-scroll');
    clearPageInert();
    if (this._returnFocus && this._returnFocus.focus) this._returnFocus.focus({ preventScroll: true });
  }
}

/* ---------- <cart-drawer> ---------- */
class CartDrawer extends BaseDrawer {
  connectedCallback() {
    super.connectedCallback();
    this.render();
    document.addEventListener('cart:updated', () => { this.renderLines(); syncBadge(); });
    this.addEventListener('click', async e => {
      const step = e.target.closest('[data-step]');
      if (step) {
        const vid = step.closest('.cart-line').dataset.variant;
        const line = Cart.items.find(i => i.variantId === vid);
        Cart.setQty(vid, line.qty + (+step.dataset.step));
      }
      const rm = e.target.closest('[data-remove]');
      if (rm) Cart.remove(rm.closest('.cart-line').dataset.variant);
      if (e.target.closest('[data-checkout]')) {
        const btn = qs('[data-checkout]', this);
        btn.disabled = true;
        btn.innerHTML = 'Placing Order...';

        try {
          const itemsPayload = Cart.items.map(line => {
            const hit = findVariant(line.variantId);
            return {
              product_id: hit ? hit.product.id : '',
              variant_id: line.variantId,
              product_title: hit ? hit.product.title : 'Plant',
              variant_label: hit ? hit.variant.label : 'Default',
              unit_price_cents: hit ? hit.variant.price : 0,
              quantity: line.qty
            };
          });

          const totalCents = Cart.total();
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_name: 'Storefront Customer',
              customer_email: 'customer@example.com',
              shipping_address: 'Keizersgracht 421',
              city: 'Amsterdam',
              postal_code: '1016 EK',
              subtotal_cents: totalCents,
              total_cents: totalCents,
              items: itemsPayload
            })
          });

          const data = await res.json();
          if (data.success) {
            btn.innerHTML = `Order Placed ✓ (${data.orderNumber})`;
            Cart.clear();
            setTimeout(() => this.close(), 2200);
          } else {
            throw new Error(data.error || 'Failed');
          }
        } catch (err) {
          btn.innerHTML = 'Checkout ✓ Demo Placed';
          Cart.clear();
          setTimeout(() => this.close(), 1600);
        }
      }
    });
  }
  render() {
    this.innerHTML = `
      <div class="drawer-backdrop"></div>
      <div class="drawer-panel">
        <div class="drawer-head">
          <h3 class="serif">Your cart <span data-linecount></span></h3>
          <button class="drawer-close" data-close aria-label="Close cart">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 2l12 12M14 2L2 14"/></svg>
          </button>
        </div>
        <div class="drawer-body" data-body></div>
        <div class="drawer-foot" data-foot></div>
      </div>`;
    this.renderLines();
  }
  renderLines() {
    const body = qs('[data-body]', this), foot = qs('[data-foot]', this);
    qs('[data-linecount]', this).textContent = Cart.count() ? `(${Cart.count()})` : '';
    if (!Cart.items.length) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 22c5.5 0 8-3.6 8-8 0-5-3.5-11-8-12-4.5 1-8 7-8 12 0 4.4 2.5 8 8 8Z"/><path d="M12 2v20"/></svg>
          <p class="serif" style="font-size:1.4rem">Nothing growing here yet.</p>
          <button class="btn" data-close>Start shopping <span class="btn-arrow">→</span></button>
        </div>`;
      foot.innerHTML = '';
      return;
    }
    const total = Cart.total();
    const freeShip = getFreeShipThreshold();
    body.innerHTML = `
      <div class="ship-meter">
        ${total >= freeShip
          ? `<p><b>Free shipping unlocked.</b> Your plants travel first class.</p>`
          : `<p>You're <b>${money(freeShip - total)}</b> away from free shipping.</p>`}
        <div class="ship-bar ${total >= freeShip ? 'full' : ''}"><i style="width:${Math.min(100, total / freeShip * 100)}%"></i></div>
      </div>
      ${Cart.items.map(line => {
        const hit = findVariant(line.variantId);
        if (!hit) return '';
        const { product, variant } = hit;
        return `
        <div class="cart-line" data-variant="${variant.id}">
          <img src="${product.images[0]}" alt="${product.title}" width="76" height="92">
          <div>
            <p class="cl-title">${product.title}</p>
            <p class="cl-opt">${product.optionName}: ${variant.label}</p>
            <div class="cl-qty">
              <button type="button" data-step="-1" aria-label="Decrease quantity">−</button>
              <output>${line.qty}</output>
              <button type="button" data-step="1" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <div class="cl-right">
            <p class="cl-price">${money(variant.price * line.qty)}</p>
            <button type="button" class="cl-remove" data-remove>Remove</button>
          </div>
        </div>`;
      }).join('')}`;
    foot.innerHTML = `
      <div class="subtotal-row"><span>Subtotal</span><b>${money(total)}</b></div>
      <button class="btn cart-checkout" data-checkout>Checkout <span class="btn-arrow" aria-hidden="true">→</span></button>
      <p class="drawer-note">Shipping &amp; taxes calculated at checkout</p>`;
  }
}
customElements.define('cart-drawer', CartDrawer);

/* ---------- <menu-drawer> ---------- */
class MenuDrawer extends BaseDrawer {
  connectedCallback() {
    super.connectedCallback();
    this.innerHTML = `
      <div class="drawer-backdrop"></div>
      <div class="drawer-panel">
        <div class="drawer-head">
          <h3 class="serif">Menu</h3>
          <button class="drawer-close" data-close aria-label="Close menu">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2 2l12 12M14 2L2 14"/></svg>
          </button>
        </div>
        <div class="drawer-body">
          <nav class="menu-links">
            ${[
              { t: 'Shop All', h: '/collections' },
              { t: 'Collections', h: '/collections' },
              { t: 'Journal', h: '/blogs' },
              { t: 'Our Roots', h: '/#story' },
              { t: 'Care Guide', h: '/#shade-finder' }
            ].map((item, i) =>
              `<a href="${item.h}" style="--i:${i}" data-close>${item.t}<span>0${i + 1}</span></a>`).join('')}
          </nav>
          <div class="menu-mini">
            <a href="#">Instagram</a><a href="#">Pinterest</a><a href="#">TikTok</a>
          </div>
        </div>
      </div>`;
  }
  open() { super.open(); /* replay link stagger */
    qsa('.menu-links a', this).forEach(a => { a.style.animation = 'none'; void a.offsetWidth; a.style.animation = ''; });
  }
}
customElements.define('menu-drawer', MenuDrawer);

/* ============================================================
   8. <predictive-search>  debounced live results
   ============================================================ */
class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="ps-panel">
        <div class="ps-inputrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></svg>
          <input type="search" placeholder="Search plants, pots, objects…" aria-label="Search products">
        </div>
        <div class="ps-results"></div>
      </div>`;
    this.input = qs('input', this);
    this.results = qs('.ps-results', this);

    this.input.addEventListener('input', debounce(() => this.run(this.input.value.trim()), 240));
    this.input.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });
    document.addEventListener('click', e => {
      if (this.classList.contains('open') && !e.target.closest('predictive-search') && !e.target.closest('[data-search-toggle]')) this.close();
    });
    this.addEventListener('click', e => {
      const chip = e.target.closest('[data-q]');
      if (chip) { this.input.value = chip.dataset.q; this.run(chip.dataset.q); this.input.focus(); }
    });
    this.renderDefault();
  }
  open() {
    this.classList.add('open');
    qs('[data-search-toggle]').setAttribute('aria-expanded', 'true');
    setTimeout(() => this.input.focus(), 80);
  }
  close() {
    this.classList.remove('open');
    qs('[data-search-toggle]').setAttribute('aria-expanded', 'false');
  }
  toggle() { this.classList.contains('open') ? this.close() : this.open(); }
  renderDefault() {
    this.results.innerHTML = `
      <p class="ps-label">Popular right now</p>
      <div class="ps-chips">
        ${['Easy care', 'Terracotta', 'Olive tree', 'Trailing', 'Objects'].map(q =>
          `<button type="button" class="ps-chip" data-q="${q}">${q}</button>`).join('')}
      </div>
      <p class="ps-label">Trending products</p>
      ${['monstera', 'olive', 'planter'].map(id => this.itemHTML(findProduct(id))).join('')}`;
  }
  itemHTML(p, q = '') {
    const title = q
      ? p.title.replace(new RegExp(`(${escRe(q)})`, 'ig'), '<mark>$1</mark>')
      : p.title;
    const v0 = p.variants.find(v => v.available) || p.variants[0];
    return `
      <a class="ps-item" href="${getProductUrl(p)}">
        <img src="${p.images[0]}" alt="" loading="lazy">
        <span><b>${title}</b><span>${p.optionName} · ${p.variants.length} options</span></span>
        <span class="ps-price">${money(v0.price)}</span>
      </a>`;
  }
  run(q) {
    if (!q) return this.renderDefault();
    const needle = q.toLowerCase();
    const hits = PRODUCTS.filter(p => (p.title + ' ' + p.tags).toLowerCase().includes(needle));
    this.results.innerHTML = hits.length
      ? `<p class="ps-label">${hits.length} result${hits.length > 1 ? 's' : ''}</p>
         ${hits.map(p => this.itemHTML(p, q)).join('')}
         <a class="ps-foot link-line" href="#" onclick="return false">View all results</a>`
      : `<div class="ps-empty">No matches for “${q}”  try “olive” or “ceramic”.</div>`;
  }
}
customElements.define('predictive-search', PredictiveSearch);

/* ============================================================
   9. <ugc-carousel>  shoppable community video cards
   Poster (.jpg) at rest → plays muted .mp4 on hover.
   Infinite wrap-around via cloned sets + native scroll.
   ============================================================ */

class UgcCarousel extends HTMLElement {
  connectedCallback() {
    const track = qs('.ugc-track', this);
    const vp = qs('.ugc-viewport', this);

    /* 1. render cards (skip if server-rendered markup already exists) */
    if (!track.children.length) {
      track.innerHTML = UGC.map(it => `
      <li class="ugc-card">
        <div class="ugc-media">
          <img class="ugc-poster" src="${it.poster}" alt="${it.name}  community video" loading="lazy" decoding="async">
          <video class="ugc-video" muted loop playsinline preload="none" src="${it.video}"></video>
        </div>
        <a class="ugc-chip" href="${it.href}" onclick="return false" aria-label="Shop ${it.name}">
          <span class="ugc-thumb"><img src="${it.thumb}" alt="" loading="lazy"></span>
          <span class="ugc-info"><b>${it.name}</b><span>${it.price}</span></span>
        </a>
      </li>`).join('');
    }

    /* 2. clones for wrap-around (one full set at each end) */
    const originals = qsa('.ugc-card', track);
    track.append(...originals.map(c => { const x = c.cloneNode(true); x.setAttribute('aria-hidden', 'true'); return x; }));
    track.prepend(...originals.map(c => { const x = c.cloneNode(true); x.setAttribute('aria-hidden', 'true'); return x; }).reverse());

    /* 3. geometry + infinite jump */
    let W = 0, midStart = 0, endStart = 0;
    const measure = () => {
      const cards = qsa('.ugc-card', track);
      midStart = cards[0].offsetLeft;            // after prepended clones... first element is a clone
      // first ORIGINAL is at index UGC.length:
      const firstOriginal = cards[UGC.length];
      const firstEndClone = cards[UGC.length * 2];
      midStart = firstOriginal.offsetLeft;
      endStart = firstEndClone.offsetLeft;
      W = endStart - midStart;
    };
    const init = () => { measure(); vp.scrollLeft = midStart; };
    requestAnimationFrame(init);
    addEventListener('resize', debounce(() => { const p = (vp.scrollLeft - midStart) / W; measure(); vp.scrollLeft = midStart + p * W; }, 250));

    let wrapQueued = false;
    vp.addEventListener('scroll', () => {
      if (wrapQueued) return;
      wrapQueued = true;
      requestAnimationFrame(() => {
        wrapQueued = false;
        if (vp.scrollLeft >= endStart - 2) vp.scrollLeft -= W;
        else if (vp.scrollLeft <= midStart - W + 2) vp.scrollLeft += W;
      });
    }, { passive: true });

    /* 4. arrows  one card per click */
    const step = () => {
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      return originals[0].getBoundingClientRect().width + gap;
    };
    qs('[data-prev]', this).addEventListener('click', () => vp.scrollBy({ left: -step(), behavior: 'smooth' }));
    qs('[data-next]', this).addEventListener('click', () => vp.scrollBy({ left:  step(), behavior: 'smooth' }));

    /* 5. mouse drag (desktop) */
    let dragging = false, startX = 0, startScroll = 0, moved = 0;
    vp.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      dragging = true; moved = 0; startX = e.clientX; startScroll = vp.scrollLeft;
      vp.classList.add('dragging');
    });
    addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      vp.scrollLeft = startScroll - dx;
    });
    addEventListener('pointerup', () => { dragging = false; vp.classList.remove('dragging'); });
    vp.addEventListener('click', e => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } }, true);

    /* 6. hover → play video; leave → back to poster */
    const play = card => {
      const v = qs('.ugc-video', card);
      v.muted = true;
      if (!v.dataset.loaded) { v.load(); v.dataset.loaded = '1'; }
      v.play().catch(() => {});
      card.classList.add('playing');
    };
    const stop = card => {
      const v = qs('.ugc-video', card);
      v.pause(); try { v.currentTime = 0; } catch {}
      card.classList.remove('playing');
    };
    if (matchMedia('(hover: hover)').matches) {
      track.addEventListener('mouseover', e => {
        const card = e.target.closest('.ugc-card');
        if (card && !card.contains(e.relatedTarget)) play(card);
      });
      track.addEventListener('mouseout', e => {
        const card = e.target.closest('.ugc-card');
        if (card && !card.contains(e.relatedTarget)) stop(card);
      });
    } else {
      /* touch: tap (outside chip) toggles playback */
      track.addEventListener('click', e => {
        const card = e.target.closest('.ugc-card');
        if (!card || e.target.closest('.ugc-chip') || moved > 8) return;
        card.classList.contains('playing') ? stop(card) : play(card);
      });
    }
  }
}
/* ============================================================
   9b. <snap-carousel>  generic scroll-snap card slider (journal)
   ============================================================ */
class SnapCarousel extends HTMLElement {
  connectedCallback() {
    const vp = qs('.snap-viewport', this), track = qs('.snap-track', this);
    const prev = qs('[data-prev]', this), next = qs('[data-next]', this);
    if (!vp || !track) return;
    qsa('img', track).forEach(i => (i.draggable = false));

    const Embla = window.EmblaCarousel || window.emblaCarousel;
    if (Embla) {
      try {
        /* physics-based drag via Embla  no CSS snap fighting */
        vp.classList.add('embla-on');
        const embla = Embla(vp, {
          loop: false, align: 'start', containScroll: 'trimSnaps', slidesToScroll: 1
        });
        const update = () => {
          if (prev) prev.classList.toggle('disabled', !embla.canScrollPrev());
          if (next) next.classList.toggle('disabled', !embla.canScrollNext());
        };
        embla.on('select', update);
        embla.on('reInit', update);
        addEventListener('resize', debounce(() => embla.reInit(), 200));
        update();
        if (prev) prev.onclick = () => embla.scrollPrev();
        if (next) next.onclick = () => embla.scrollNext();
        return;
      } catch {
        vp.classList.remove('embla-on'); /* fall through to native slider */
      }
    }

    /* --- native fallback (embla unavailable) --- */
    const step = () => {
      const c = track.children[0];
      return c ? c.getBoundingClientRect().width + (parseFloat(getComputedStyle(c).marginRight) || 0) : 300;
    };
    const update = () => {
      const max = vp.scrollWidth - vp.clientWidth;
      if (prev) prev.classList.toggle('disabled', vp.scrollLeft <= 2);
      if (next) next.classList.toggle('disabled', vp.scrollLeft >= max - 2);
    };
    let raf = false;
    vp.addEventListener('scroll', () => {
      if (raf) return; raf = true;
      requestAnimationFrame(() => { raf = false; update(); });
    }, { passive: true });
    update();
    if (prev) prev.onclick = () => vp.scrollBy({ left: -step(), behavior: 'smooth' });
    if (next) next.onclick = () => vp.scrollBy({ left: step(), behavior: 'smooth' });
    /* mouse drag */
    let down = false, sx = 0, sl = 0, moved = 0;
    vp.addEventListener('dragstart', e => e.preventDefault());
    vp.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = vp.scrollLeft; vp.classList.add('dragging');
    });
    addEventListener('pointermove', e => { if (down) { moved = Math.max(moved, Math.abs(e.clientX - sx)); vp.scrollLeft = sl - (e.clientX - sx); } });
    addEventListener('pointerup', () => { down = false; vp.classList.remove('dragging'); });
    vp.addEventListener('click', e => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
}
customElements.define('snap-carousel', SnapCarousel);

/* ============================================================
   9c. <shade-finder>  capsule tabs + gradient dot + grid swap
   ============================================================ */
class ShadeFinder extends HTMLElement {
  connectedCallback() {
    this.render();
  }
  render() {
    if (!SHADE_TABS || !SHADE_TABS.length) return;
    const currentOn = qs('.sf-tab.on', this);
    const activeIndex = currentOn && currentOn.dataset.i !== undefined ? Number(currentOn.dataset.i) : 0;

    const caps = qs('.sf-caps', this);
    if (caps) {
      caps.innerHTML = SHADE_TABS.map((t, i) => `
        <button class="sf-tab ${i === activeIndex ? 'on' : ''}" role="tab" aria-selected="${i === activeIndex ? 'true' : 'false'}" data-i="${i}">
          <span class="sf-pill"><img src="${t.img || 'assets/img/p-pothos-2.jpg'}" alt="${t.label}" loading="lazy"></span>
          <span class="sf-label">${t.label}</span>
        </button>
      `).join('');
    }

    const track = qs('.sf-track', this);
    if (track && !qs('.sf-line', track)) {
      track.innerHTML = '<i class="sf-line"></i><i class="sf-dot"></i>';
    }

    const grid = qs('[data-grid]', this);
    const tabs = qsa('.sf-tab', this);
    const n = tabs.length;
    const select = (i, animate = true) => {
      tabs.forEach((t, k) => {
        t.classList.toggle('on', k === i);
        t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      if (track) track.style.setProperty('--pos', (i / Math.max(1, n - 1)) * 100 + '%');
      if (!animate) {
        if (SHADE_TABS[i] && SHADE_TABS[i].products && grid) {
          grid.innerHTML = SHADE_TABS[i].products.map((id, k) =>
            `<product-card product="${id}" data-reveal style="--d:${k * 90}ms"></product-card>`).join('');
          initReveals(grid);
        }
        return;
      }
      if (grid) {
        grid.classList.add('switching');
        setTimeout(() => {
          if (SHADE_TABS[i] && SHADE_TABS[i].products) {
            grid.innerHTML = SHADE_TABS[i].products.map((id, k) =>
              `<product-card product="${id}" data-reveal style="--d:${k * 90}ms"></product-card>`).join('');
            initReveals(grid);
          }
          grid.classList.remove('switching');
        }, 220);
      }
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => { if (!t.classList.contains('on')) select(i); }));
    select(Math.min(activeIndex, Math.max(0, n - 1)), false);
  }
}
customElements.define('shade-finder', ShadeFinder);

customElements.define('ugc-carousel', UgcCarousel);

/* ============================================================
   9d. <seen-carousel> + <shop-modal>  shoppable videos ("As Seen In")
   Original re-implementation of Purity's shoppable_video module.
   ============================================================ */
const tryPlay = v => { try { const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch { /* no media in tests */ } };

class ShopModal extends BaseDrawer {
  connectedCallback() {
    super.connectedCallback();
    this.classList.remove('drawer');       /* centered dialog, not a side drawer */
    this.classList.add('smodal-host');
  }
  openVideo(handle) {
    const p = findProduct(handle);
    if (!p) return;
    const v0 = p.variants.find(v => v.available) || p.variants[0];
    this.innerHTML = `
      <div class="smodal-backdrop" data-close></div>
      <div class="smodal-box" style="--col-width:50%">
        <button class="smodal-x" type="button" data-close aria-label="Close dialog">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l10 10M12 2 2 12"/></svg>
        </button>
        <div class="smodal-media">
          <video muted loop playsinline autoplay src="${p.video}" poster="${p.gallery[0]}"></video>
          <button class="smodal-sound" type="button" aria-pressed="false" aria-label="Toggle sound">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor" stroke="none"/><path class="s-on" d="M15.5 9.5a4 4 0 0 1 0 5" style="display:none"/><path class="s-off" d="M15 9.5l5 5M20 9.5l-5 5"/></svg>
            <span>Sound</span>
          </button>
        </div>
        <div class="smodal-side">
          <p class="smodal-kicker">As seen in this video</p>
          <h3 class="smodal-name">${p.title}</h3>
          <p class="smodal-rate"><span class="stars" aria-hidden="true">★★★★★</span> ${p.rating.toFixed(1)} · ${p.reviews} reviews</p>
          <p class="smodal-price">${money(v0.price)}${v0.compareAt ? ` <s>${money(v0.compareAt)}</s>` : ''}</p>
          <variant-radios product="${p.id}"></variant-radios>
          <button class="btn btn-dark smodal-add" type="button">Add to cart  ${money(v0.price)}</button>
          <a class="smodal-link" href="${getProductUrl(p)}">View full details <span aria-hidden="true">→</span></a>
          <ul class="smodal-points">
            <li>Free carbon-neutral shipping over $75</li>
            <li>30-day rooted-and-thriving guarantee</li>
          </ul>
        </div>
      </div>`;
    const video = qs('video', this);
    tryPlay(video);
    const sound = qs('.smodal-sound', this);
    sound.addEventListener('click', () => {
      video.muted = !video.muted;
      sound.classList.toggle('on', !video.muted);
      sound.setAttribute('aria-pressed', String(!video.muted));
      qs('.s-on', sound).style.display = video.muted ? 'none' : '';
      qs('.s-off', sound).style.display = video.muted ? '' : 'none';
      tryPlay(video);
    });
    let current = v0;
    const add = qs('.smodal-add', this), price = qs('.smodal-price', this);
    this.addEventListener('variant:change', e => {
      current = e.detail.variant;
      price.innerHTML = `${money(current.price)}${current.compareAt ? ` <s>${money(current.compareAt)}</s>` : ''}`;
      add.textContent = current.available ? `Add to cart  ${money(current.price)}` : 'Sold out';
      add.disabled = !current.available;
    });
    add.addEventListener('click', () => {
      if (!current.available) return;
      const vid = current.id;
      this.close();
      setTimeout(() => document.dispatchEvent(new CustomEvent('cart:add', { detail: { variantId: vid } })), 90);
    });
    this.open();
  }
  close() {
    const v = qs('video', this);
    if (v) { try { v.pause(); } catch { /* noop */ } }
    super.close();
  }
}
customElements.define('shop-modal', ShopModal);

class SeenCarousel extends HTMLElement {
  connectedCallback() {
    const vp = qs('.seen-viewport', this);
    const prev = qs('[data-prev]', this), next = qs('[data-next]', this);
    const step = () => {
      const c = vp.querySelector('.seen-card');
      return c ? c.getBoundingClientRect().width + (parseFloat(getComputedStyle(c).marginRight) || 0) : 280;
    };
    const update = () => {
      const max = vp.scrollWidth - vp.clientWidth;
      const noOverflow = max <= 4;                        /* 5 cards fit: hide arrows like the reference */
      if (prev) { prev.style.display = noOverflow ? 'none' : ''; prev.classList.toggle('disabled', vp.scrollLeft <= 2); }
      if (next) { next.style.display = noOverflow ? 'none' : ''; next.classList.toggle('disabled', vp.scrollLeft >= max - 2); }
    };
    let raf = false;
    vp.addEventListener('scroll', () => {
      if (raf) return; raf = true;
      requestAnimationFrame(() => { raf = false; update(); });
    }, { passive: true });
    update();
    addEventListener('resize', debounce(update, 200));
    if (prev) prev.onclick = () => vp.scrollBy({ left: -step(), behavior: 'smooth' });
    if (next) next.onclick = () => vp.scrollBy({ left: step(), behavior: 'smooth' });

    /* mouse drag (suppressed click after real drag) */
    let down = false, sx = 0, sl = 0, moved = 0;
    vp.addEventListener('dragstart', e => e.preventDefault());
    vp.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = vp.scrollLeft; vp.classList.add('dragging');
    });
    addEventListener('pointermove', e => { if (down) { moved = Math.max(moved, Math.abs(e.clientX - sx)); vp.scrollLeft = sl - (e.clientX - sx); } });
    addEventListener('pointerup', () => { down = false; vp.classList.remove('dragging'); });
    vp.addEventListener('click', e => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } }, true);

    /* house rule: pointer away → poster; hover → muted loop; leave → pause + rewind */
    qsa('.seen-card', this).forEach(card => {
      const v = qs('video', card);
      card.addEventListener('pointerenter', e => {
        if (e.pointerType !== 'mouse') return;
        card.classList.add('playing'); tryPlay(v);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('playing');
        try { v.pause(); v.currentTime = 0; } catch { /* noop */ }
      });
    });

    /* open the shoppable modal */
    this.addEventListener('click', e => {
      const btn = e.target.closest('[data-seen]');
      if (!btn) return;
      const m = qs('shop-modal');
      if (m) m.openVideo(btn.dataset.seen);
    });
  }
}
customElements.define('seen-carousel', SeenCarousel);

/* ============================================================
   10. Page wiring: header, drawers, search, parallax, forms
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initReveals();
  syncBadge();

  /* header state */
  const header = qs('.site-header');
  addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8), { passive: true });

  /* drawers & search toggles */
  qs('[data-cart-toggle]').addEventListener('click', () => qs('cart-drawer').open());
  qs('[data-menu-toggle]').addEventListener('click', () => qs('menu-drawer').open());
  qs('[data-search-toggle]').addEventListener('click', () => qs('predictive-search').toggle());

  /* light parallax on [data-parallax] */
  const pxEls = qsa('[data-parallax]');
  if (pxEls.length && !reduced) {
    let ticking = false;
    const apply = () => {
      ticking = false;
      pxEls.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const speed = parseFloat(el.dataset.parallax) || 40;
        const progress = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -0.5 … 0.5
        el.style.transform = `translate3d(0, ${(-progress * speed).toFixed(2)}px, 0)`;
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    apply();
  }

  /* cinema play/pause micro-interaction (index only) */
  const cinema = qs('.cinema');
  const playBtn = qs('.play-btn');
  if (cinema && playBtn) {
    playBtn.addEventListener('click', () => {
      cinema.classList.toggle('paused');
      playBtn.innerHTML = cinema.classList.contains('paused')
        ? '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 4l10 6-10 6z"/></svg>'
        : '<svg viewBox="0 0 20 20" fill="currentColor"><rect x="4" y="4" width="4" height="12" rx="1"/><rect x="12" y="4" width="4" height="12" rx="1"/></svg>';
    });
  }

  /* newsletter (index only) */
  const nlForm = qs('.nl-form');
  if (nlForm) nlForm.addEventListener('submit', async e => {
    e.preventDefault();
    const input = qs('input[type="email"]', nlForm);
    const email = input ? input.value : '';
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    } catch {}
    e.currentTarget.outerHTML = `<p class="nl-done" data-reveal>You're in. First letter arrives Sunday. 🌱</p>`;
  });

  /* editorial spotlight variant wiring */
  const spot = qs('.spotlight');
  if (spot) {
    const p = findProduct('olive');
    let current = p.variants[0];
    const priceEl = qs('.price', spot), availEl = qs('.avail', spot), btn = qs('[data-spot-add]', spot);
    spot.addEventListener('variant:change', e => {
      current = e.detail.variant;
      priceEl.textContent = money(current.price);
      availEl.classList.toggle('out', !current.available);
      availEl.textContent = current.available ? 'In stock  ships in 48h' : 'Sold out';
      btn.disabled = !current.available;
    });
    btn.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('cart:add', { detail: { variantId: current.id } }));
    });
  }

  /* campaign coupon copy + flash countdown (PDP) */
  qsa('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(btn.dataset.copy); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = btn.dataset.copy; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
    btn.classList.add('copied');
    const old = btn.textContent;
    btn.textContent = 'Copied ✓';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = old; }, 1600);
  }));

  const flashTimer = qs('[data-flash-timer]');
  if (flashTimer) {
    let end = +localStorage.getItem('frond_flash_end') || 0;
    if (!end || end < Date.now()) {
      end = Date.now() + 26 * 3600 * 1000;
      localStorage.setItem('frond_flash_end', String(end));
    }
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      flashTimer.textContent = `${h}:${m}:${sec}`;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* smooth anchor for in-page links */
  qsa('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href.length < 2) { e.preventDefault(); return; }
    const target = qs(href);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); }
  }));
});

/* ============================================================
   11. Live Storefront Hydration (Hono + SQLite Reactive Sync)
   ============================================================ */
function hydrateLiveStorefront(data) {
  if (!data) return;

  // 1. Announcements Marquee
  if (Array.isArray(data.announcements) && data.announcements.length > 0) {
    const announceBands = qsa('.announce marquee-band, .band marquee-band');
    const itemsHtml = data.announcements.map(a =>
      `<span class="mq-item">${a.text} <i>${a.icon || '✦'}</i></span>`
    ).join('');
    announceBands.forEach(b => {
      const track = qs('.mq-track', b) || qs('.mq-group', b);
      if (track) {
        track.innerHTML = itemsHtml;
      }
    });
  }

  // 2. Hero Section
  if (qs('.hero')) {
    const h = data.hero || {};

    // Optional Eyebrow
    const eyebrow = qs('.hero-text .eyebrow');
    if (eyebrow) {
      if (h.eyebrow && h.eyebrow.trim()) {
        eyebrow.textContent = h.eyebrow.trim();
        eyebrow.style.display = '';
      } else {
        eyebrow.style.display = 'none';
      }
    }

    // Optional Title Lines
    const titleEl = qs('.hero-title');
    if (titleEl) {
      const l1 = (h.title_line_1 || '').trim();
      const acc = (h.title_accent || '').trim();
      const l2 = (h.title_line_2 || '').trim();
      const l3 = (h.title_line_3 || '').trim();
      
      let titleHtml = '';
      if (l1) titleHtml += `<reveal-text>${l1}</reveal-text> `;
      if (acc) titleHtml += `<reveal-text class="ib accent">${acc}</reveal-text> `;
      if (l2) titleHtml += `<reveal-text>${l2}</reveal-text> `;
      if (l3) titleHtml += `<reveal-text>${l3}</reveal-text>`;

      if (titleHtml.trim()) {
        titleEl.innerHTML = titleHtml;
        titleEl.style.display = '';
      } else {
        titleEl.style.display = 'none';
      }
    }

    // Optional Subtitle / Copy
    const copyEl = qs('.hero-copy');
    if (copyEl) {
      if (h.subtitle && h.subtitle.trim()) {
        copyEl.textContent = h.subtitle.trim();
        copyEl.style.display = '';
      } else {
        copyEl.style.display = 'none';
      }
    }

    // Optional CTA Buttons
    const ctasEl = qs('.hero-ctas');
    if (ctasEl) {
      const btn1 = (h.cta_primary_label || '').trim();
      const link1 = (h.cta_primary_link || '#shop').trim();
      const btn2 = (h.cta_secondary_label || '').trim();
      const link2 = (h.cta_secondary_link || '#story').trim();
      
      let ctasHtml = '';
      if (btn1) ctasHtml += `<a class="btn" href="${link1}">${btn1} <span class="btn-arrow">→</span></a> `;
      if (btn2) ctasHtml += `<a class="btn btn--ghost" href="${link2}">${btn2}</a>`;

      if (ctasHtml.trim()) {
        ctasEl.innerHTML = ctasHtml;
        ctasEl.style.display = '';
      } else {
        ctasEl.style.display = 'none';
      }
    }

    // Optional Metrics
    const metaEl = qs('.hero-meta');
    if (metaEl) {
      const m1v = (h.metric_1_value || '').trim();
      const m1l = (h.metric_1_label || '').trim();
      const m2v = (h.metric_2_value || '').trim();
      const m2l = (h.metric_2_label || '').trim();
      const m3v = (h.metric_3_value || '').trim();
      const m3l = (h.metric_3_label || '').trim();
      
      let metricsHtml = '';
      if (m1v || m1l) metricsHtml += `<div>${m1v ? `<b data-count>${m1v}</b>` : ''}${m1l}</div>`;
      if (m2v || m2l) metricsHtml += `<div>${m2v ? `<b>${m2v}</b>` : ''}${m2l}</div>`;
      if (m3v || m3l) metricsHtml += `<div>${m3v ? `<b>${m3v}</b>` : ''}${m3l}</div>`;

      if (metricsHtml.trim()) {
        metaEl.innerHTML = metricsHtml;
        metaEl.style.display = '';
      } else {
        metaEl.style.display = 'none';
      }
    }

    // Hero Showcase: Single-row horizontal Embla Carousel with left fade shadow mask
    const heroFig = qs('.hero-figure');
    if (heroFig) {
      const allProds = Array.isArray(data.products) && data.products.length > 0 ? data.products : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []);
      const published = allProds.filter(p => p.is_published !== false);
      const best = published.filter(p => p.bestseller || (p.badge && p.badge.toLowerCase().includes('bestseller')));
      const displayBestsellers = best.length > 0 ? best : published;
      const Embla = window.EmblaCarousel || window.emblaCarousel;

      heroFig.innerHTML = `
        <div class="hc-carousel-wrap">
          <div class="hc-fade-left" aria-hidden="true"></div>
          <div class="hc-embla-vp">
            <div class="hc-embla-container">
              ${displayBestsellers.map((p, idx) => `
                <div class="hc-slide">
                  <figure class="hc-cell hc-card" style="--r:${idx % 2 === 0 ? '-1.5deg' : '1.5deg'}">
                    <product-card product="${p.id}" cta-label="Sepete Ekle"></product-card>
                    ${idx === 1 ? `
                      <svg class="hc-flower" viewBox="0 0 64 64" aria-hidden="true">
                        <g fill="#F3C6CF"><ellipse cx="32" cy="15" rx="7" ry="12"/><ellipse cx="32" cy="49" rx="7" ry="12"/><ellipse cx="15" cy="32" rx="12" ry="7"/><ellipse cx="49" cy="32" rx="12" ry="7"/><ellipse cx="20" cy="20" rx="8" ry="8"/><ellipse cx="44" cy="20" rx="8" ry="8"/><ellipse cx="20" cy="44" rx="8" ry="8"/><ellipse cx="44" cy="44" rx="8" ry="8"/></g>
                        <circle cx="32" cy="32" r="7.5" fill="#E9B44C"/>
                        <circle cx="32" cy="32" r="3" fill="#C9871F"/>
                      </svg>` : ''}
                  </figure>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      // Initialize Single-Row Embla Carousel
      const vp = qs('.hc-embla-vp', heroFig);
      if (vp && typeof Embla === 'function') {
        Embla(vp, { loop: true, align: 'start', dragFree: true });
      }
    }
  }

  // 3. Bestsellers / Shop Grid
  if (Array.isArray(data.products) && data.products.length > 0) {
    const shopGrid = qs('#shop .product-grid');
    if (shopGrid) {
      const list = data.products.filter(p => p.is_published !== false);
      const best = list.filter(p => p.bestseller);
      const displayProds = best.length > 0 ? best : list.slice(0, 8);
      shopGrid.innerHTML = displayProds.map((p, idx) =>
        `<product-card product="${p.id}" data-reveal style="--d:${idx * 100}ms"></product-card>`
      ).join('');
      initReveals(shopGrid);
    }
  }

  // 4. Collection Highlights (Made for Your Home)
  if (Array.isArray(data.collections) && data.collections.length > 0) {
    const chCards = qs('.ch-cards');
    const chList = qs('.ch-list');
    
    // Exactly 2 big featured cards on left
    const featuredCols = data.collections.slice(0, 2);
    if (chCards && featuredCols.length > 0) {
      chCards.innerHTML = featuredCols.map((col, idx) => `
        <a class="ch-card" href="index.html#shop" data-reveal style="--d:${idx * 120}ms">
          <img src="${col.image_url}" alt="${col.title}" loading="lazy" decoding="async">
          <figcaption>${col.title}<sup>${col.item_count_label || ''}</sup></figcaption>
        </a>
      `).join('');
      initReveals(chCards);
    }

    // Remaining collections populate the interactive .ch-list rows on right
    const listCols = data.collections.length > 2 ? data.collections.slice(2, 6) : data.collections;
    if (chList && listCols.length > 0) {
      chList.innerHTML = listCols.map(col => `
        <a class="ch-row" href="index.html#shop">
          <span class="ch-name">${col.title}<sup>${col.item_count_label || ''}</sup></span>
          <span class="ch-preview"><img src="${col.image_url}" alt="${col.title}" loading="lazy"></span>
          <span class="ch-btn"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2l6 6-6 6"/></svg></span>
        </a>
      `).join('');
    }
  }

  // 5. Shop by Mood
  if (Array.isArray(data.moodTiles) && data.moodTiles.length > 0) {
    const tilesContainer = qs('.tiles');
    if (tilesContainer) {
      tilesContainer.innerHTML = data.moodTiles.map((mt, idx) => `
        <a class="tile" href="${mt.link_url || 'index.html#shop'}" data-reveal style="--d:${idx * 120}ms">
          <img src="${mt.image_url}" alt="${mt.title}" loading="lazy">
          <span class="tile-label">
            <h3>${mt.title}</h3>
            <span class="tile-go">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 8h12M9 3l5 5-5 5"/></svg>
            </span>
          </span>
        </a>
      `).join('');
      initReveals(tilesContainer);
    }
  }

  // 6. Shade Finder
  const sf = qs('shade-finder');
  if (sf && typeof sf.render === 'function') {
    sf.render();
  }

  // 7. Editorial Spotlight
  if (data.editorial && qs('#story')) {
    const ed = data.editorial;
    const imgEl = qs('.story-media img');
    if (imgEl && ed.image_url) imgEl.src = ed.image_url;

    const eyebrow = qs('.story-copy .eyebrow');
    if (eyebrow && ed.eyebrow) eyebrow.textContent = ed.eyebrow;

    const title = qs('.story-copy h2');
    if (title && ed.title) title.innerHTML = `<reveal-text>${ed.title}</reveal-text>`;

    const lead = qs('.story-lead');
    if (lead && ed.lead_text) lead.textContent = ed.lead_text;

    const body = qs('.story-body');
    if (body && ed.body_text) body.textContent = ed.body_text;

    const stats = qs('.story-stats');
    if (stats) {
      stats.innerHTML = `
        <div><b>${ed.stat_1_value || '2019'}</b>${ed.stat_1_label || 'Founded in a tiny loft'}</div>
        <div><b>${ed.stat_2_value || '40+'}</b>${ed.stat_2_label || 'Botanical varieties grown'}</div>
        <div><b>${ed.stat_3_value || '100%'}</b>${ed.stat_3_label || 'Plastic-free packaging'}</div>
      `;
    }

    const spotCard = qs('.spotlight variant-radios');
    if (spotCard && ed.spotlight_product_id) {
      spotCard.setAttribute('product', ed.spotlight_product_id);
    }
  }

  // 8. FAQs Accordion
  if (Array.isArray(data.faqs) && data.faqs.length > 0) {
    const faqList = qs('.faq-list');
    if (faqList) {
      faqList.innerHTML = data.faqs.map(f => `
        <details class="faq-item" data-reveal>
          <summary class="faq-q">
            <span>${f.question}</span>
            <svg class="faq-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M8 3v10M3 8h10"/>
            </svg>
          </summary>
          <div class="faq-a">
            <p>${f.answer}</p>
          </div>
        </details>
      `).join('');
      initReveals(faqList);
    }
  }

  // 9. Blog Articles
  if (Array.isArray(data.blogs) && data.blogs.length > 0) {
    const blogGrid = qs('.blog-grid');
    if (blogGrid) {
      blogGrid.innerHTML = data.blogs.map((b, idx) => `
        <article class="blog-card" data-reveal style="--d:${idx * 100}ms">
          <figure class="blog-media">
            <img src="${b.cover_image}" alt="${b.title}" loading="lazy" decoding="async">
            ${b.category ? `<span class="blog-tag">${b.category}</span>` : ''}
          </figure>
          <div class="blog-body">
            <p class="blog-meta">${b.read_time || '4 min read'} · ${b.published_at ? new Date(b.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}</p>
            <h3 class="blog-title">${b.title}</h3>
            <p class="blog-excerpt">${b.excerpt}</p>
            <a class="blog-link" href="#" onclick="return false">Read article <span class="btn-arrow">→</span></a>
          </div>
        </article>
      `).join('');
      initReveals(blogGrid);
    }
  }

  // 10. Re-render standalone product cards & variants
  qsa('product-card').forEach(card => {
    if (typeof card.render === 'function') card.render();
  });
  qsa('variant-radios').forEach(vr => {
    if (typeof vr.render === 'function') vr.render();
  });
}

document.addEventListener('catalog:live', e => hydrateLiveStorefront(e.detail));

/* ============================================================
   Lenis Smooth Scrolling (https://lenis.dev/)
   ============================================================ */
if (!reduced) {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof Lenis !== 'undefined' && !window._globalLenis) {
      try {
        const lenis = new Lenis({
          duration: 1.15,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 0.95,
          touchMultiplier: 1.5,
        });
        window._globalLenis = lenis;

        function raf(time) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      } catch (err) {
        console.warn('Lenis init:', err);
      }
    }
  });
}
