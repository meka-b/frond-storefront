/* ============================================================
   FROND — product.js  (PDP controller)
   Sticky gallery + Embla carousel (CDN) with vanilla fallback,
   hover-to-play video slides, variant picker, cart integration.
   Globals reused from data.js / theme.js: PRODUCTS, findProduct,
   money, qs, qsa, debounce, initReveals, reduced.
   ============================================================ */
'use strict';

function extractProductHandle() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('handle')) return params.get('handle');

  const path = window.location.pathname;
  // Match /plants/:category/:handle or /plants/:handle
  const match = path.match(/\/plants\/(?:[^\/]+\/)?([^\/\.]+)/);
  if (match && match[1]) return match[1];

  return 'monstera';
}

function renderPDP(liveData) {
  const root = document.getElementById('pdp-root');
  if (!root) return;

  const handle = extractProductHandle();
  const p = PRODUCTS.find(x => x.id === handle);

  /* ---------- not found ---------- */
  if (!p) {
    root.innerHTML = `
      <div class="container pdp">
        <div class="pdp-notfound">
          <h1 class="serif">This plant wandered off.</h1>
          <a class="btn" href="/#shop">Back to the shop <span class="btn-arrow">→</span></a>
        </div>
      </div>`;
    return;
  }

  document.title = `${p.title} — FROND`;

  const v0 = p.variants.find(v => v.available) || p.variants[0];
  const tryPlaySafe = v => { try { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } catch { /* no media in tests */ } };
  const savePct = v => v.compareAt ? Math.round((1 - v.price / v.compareAt) * 100) : 0;
  /* complementary pool — non-UGC first, then community items (Purity intent=complementary) */
  const rel = [...PRODUCTS.filter(x => x.id !== p.id && !x.ugc), ...PRODUCTS.filter(x => x.id !== p.id && x.ugc)];
  /* every PDP shows the video rail — pool = all video-owning products, current first */
  const seeVids = [p, ...rel].filter(x => x.video).slice(0, 5);

  /* ---------- slides (two-column media grid — Purity parity) ---------- */
  const slideCount = p.gallery.length + (p.video ? 1 : 0);
  const slidesHTML = p.gallery.map((src, i) =>
    `<figure class="gg-item" data-i="${i}" tabindex="0" role="button" aria-label="Open image ${i + 1} in lightbox">
       <img src="${src}" alt="${p.title} — view ${i + 1}" ${i < 2 ? '' : 'loading="lazy"'} decoding="async" draggable="false">
     </figure>`
  ).join('') + (p.video ? `
    <figure class="gg-item gg-item--video" data-i="${slideCount - 1}" tabindex="0" role="button" aria-label="Open video in lightbox">
      <video muted loop playsinline preload="none" src="${p.video}" poster="${p.gallery[0]}"></video>
      <span class="gal-play" aria-hidden="true"><span><svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 4l10 6-10 6z"/></svg></span></span>
    </figure>` : '');

  const stars = '★'.repeat(Math.round(p.rating)) + '☆'.repeat(5 - Math.round(p.rating));

  /* ---------- template ---------- */
  /* ---------- info column order (Purity): rating → title → price → desc → variant ---------- */
  root.innerHTML = `
  <div class="container pdp">
    <nav class="pdp-crumb" aria-label="Breadcrumb">
      <a href="/">Home</a><span aria-hidden="true">/</span>
      <a href="/#shop">Plants</a><span aria-hidden="true">/</span>
      <a href="/collections">${getProductCategory(p)}</a><span aria-hidden="true">/</span>
      <span>${p.title}</span>
    </nav>

    <div class="pdp-grid">
      <!-- media grid: two_columns (like Purity product__media-gallery) -->
      <div class="pdp-media product__media-gallery two_columns">
        ${p.badge ? `<span class="gal-badge ${p.badgeCls}">${p.badge}</span>` : ''}
        <grid-gallery id="GalleryViewer-main" data-loop="true"
          style="--col-number: 1.5; --gap: 8px; --gap-desktop: 10px; --row-gap: 10px; --col-desktop: 2;">
          <div class="gg-vp">
            <div class="gg-track">${slidesHTML}</div>
          </div>
          <button class="gg-arrow prev" type="button" data-gg-prev aria-label="Previous media">
            <svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 1 1 7l6 6"/></svg>
          </button>
          <button class="gg-arrow next" type="button" data-gg-next aria-label="Next media">
            <svg viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 1l6 6-6 6"/></svg>
          </button>
          <p class="gg-count" aria-live="polite"><span data-gg-cur>1</span> / ${slideCount}</p>
        </grid-gallery>
        <div class="gg-progress" aria-hidden="true"><i data-ggp></i></div>
      </div>

      <!-- info column (sticky on desktop — ProductInfo) -->
      <div class="pdp-info" id="ProductInfo-main">
        <div class="pdp-rating" data-reveal>
          <span class="stars" aria-label="${p.rating} out of 5">${stars}</span>
          <span>${p.rating.toFixed(1)} — ${p.reviews} reviews</span>
        </div>
        <h1 class="pdp-title"><reveal-text>${p.title}</reveal-text></h1>
        <p class="pdp-price" data-reveal>
          <span class="val" data-price>${money(v0.price)}</span>
          ${v0.compareAt ? `<s data-compare>${money(v0.compareAt)}</s><span class="pdp-save" data-save>Save ${savePct(v0)}%</span>` : `<s data-compare hidden></s><span class="pdp-save" data-save hidden></span>`}
        </p>
        <div class="pdp-desc-wrap" data-reveal data-lenis-prevent data-lenis-prevent-wheel>
          <div class="pdp-desc" data-lenis-prevent data-lenis-prevent-wheel tabindex="0" role="region" aria-label="Ürün Detaylı Açıklaması">${p.desc}</div>
          <div class="pdp-desc-fade" aria-hidden="true"></div>
        </div>
        <p class="pdp-avail" data-avail data-reveal>In stock — ships in 48h</p>
        <variant-radios product="${p.id}" data-reveal></variant-radios>
        <div class="qty-row">
          <div class="qty-step" data-reveal>
            <button type="button" data-qminus aria-label="Decrease quantity">−</button>
            <output data-qty>1</output>
            <button type="button" data-qplus aria-label="Increase quantity">+</button>
          </div>
          <button class="btn" data-add>Add to cart — <span data-addprice>${money(v0.price)}</span></button>
        </div>
        ${seeVids.length ? `
        <div class="see-action" data-reveal>
          <div class="see-action-head">
            <p class="see-action-title">See in Action</p>
            <div class="see-action-nav">
              <button type="button" data-see-prev aria-label="Previous"><svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 1 1 7l6 6"/></svg></button>
              <button type="button" data-see-next aria-label="Next"><svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 1l6 6-6 6"/></svg></button>
            </div>
          </div>
          <div class="see-action-vp"><div class="see-action-track">
            ${seeVids.map(x => `
              <button type="button" class="see-slide media-lightbox-slide" data-see-vid="${x.video}" data-see-poster="${x.gallery[0]}" aria-label="Play video of ${x.title}">
                <img src="${x.gallery[0]}" alt="${x.title} video" loading="lazy">
                <video class="see-hover-vid" muted loop playsinline preload="none" src="${x.video}"></video>
                <span class="see-play"><svg width="8" height="10" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z"/></svg></span>
              </button>`).join('')}
          </div></div>
        </div>` : ''}
        <div class="pdp-acc" data-reveal>
          <details open>
            <summary>Care guide <i>+</i></summary>
            <div class="acc-body">
              <p><b>Light —</b> ${p.care.light}</p>
              <p><b>Water —</b> ${p.care.water}</p>
              <p><b>Pets —</b> ${p.care.pet}</p>
            </div>
          </details>
          <details>
            <summary>Shipping &amp; guarantee <i>+</i></summary>
            <div class="acc-body"><p>Every plant is packed the day it ships in a soil-lock, plastic-free box. If it arrives unhappy — or declines within 7 days — we send a replacement, no photo-bureaucracy.</p></div>
          </details>
          <details>
            <summary>Details <i>+</i></summary>
            <div class="acc-body"><p>SKU ${p.sku} · Nursery pot Ø 14–17 cm · Decorative pot fits with 2 cm of breathing room. Ships in its nursery pot; decorative pots ship empty alongside.</p></div>
          </details>
        </div>
      </div>
    </div>
  </div>`;

  /* ---------- gallery: two-column grid (desktop) / 1.5-col swipe (mobile) ---------- */
  const gallery = qs('grid-gallery', root);
  const ggp = qs('[data-ggp]', root);
  let index = 0;

  const pauseVideos = () => qsa('.gg-item--video video', root).forEach(v => {
    v.pause(); try { v.currentTime = 0; } catch {}
    v.closest('.gg-item--video').classList.remove('playing');
  });

  /* ---------- Embla gallery carousel — horizontal swipe (left/right) ----------
     Desktop: 1 media per view + chevron arrows + n/N counter.
     ≤1024px: 1.5-slide peek + progress bar. Native scroll-snap fallback
     if the vendored Embla bundle failed to load. */
  const ggVp = qs('.gg-vp', root);
  const ggCur = qs('[data-gg-cur]', root);
  if (slideCount <= 1) qsa('.gg-arrow, .gg-count', root).forEach(b => b.remove());

  const galVideoSync = () => qsa('.gg-item--video', root).forEach(f => {
    const v = qs('video', f), active = +f.dataset.i === index;
    f.classList.toggle('playing', active);
    if (active) tryPlaySafe(v); else { v.pause(); try { v.currentTime = 0; } catch {} }
  });
  const setGalIndex = i => {
    index = Math.max(0, Math.min(slideCount - 1, i));
    if (ggCur) ggCur.textContent = index + 1;
    galVideoSync();
  };

  const galPrev = qs('[data-gg-prev]', root), galNext = qs('[data-gg-next]', root);
  /* Embla is the MOBILE layer (≤1024px 1.5-peek swipe). Desktop shows the
     static two_columns grid, so Embla mounts/destroys on breakpoint change. */
  const mqGal = window.matchMedia ? matchMedia('(max-width: 1024px)') : { matches: true, addEventListener() {} };
  let ggEmbla = null;
  const ggEmblaInit = () => {
    if (ggEmbla || slideCount <= 1 || !window.EmblaCarousel || !mqGal.matches) return;
    try { ggEmbla = window.EmblaCarousel(ggVp, { loop: true, align: 'start', skipSnaps: false }); }
    catch { ggEmbla = null; return; }
    ggVp.classList.add('is-embla');
    ggEmbla.on('select', () => setGalIndex(ggEmbla.selectedScrollSnap()));
    ggEmbla.on('scroll', () => ggp && ggp.style.setProperty('--gg-scale', Math.max(.12, ggEmbla.scrollProgress())));
    if (galPrev) galPrev.onclick = () => ggEmbla.scrollPrev();
    if (galNext) galNext.onclick = () => ggEmbla.scrollNext();
    setGalIndex(ggEmbla.selectedScrollSnap());
  };
  const ggEmblaDestroy = () => {
    if (!ggEmbla) return;
    ggEmbla.destroy();
    ggEmbla = null;
    ggVp.classList.remove('is-embla');
    ggVp.scrollLeft = 0;
  };
  ggEmblaInit();
  try { mqGal.addEventListener('change', () => { mqGal.matches ? ggEmblaInit() : ggEmblaDestroy(); }); } catch {}

  if (!window.EmblaCarousel && slideCount > 1) {
    /* native scroll-snap fallback — arrows & progress bar still work */
    const galStep = () => {
      const f = qs('.gg-item', root);
      return f ? f.getBoundingClientRect().width + 10 : ggVp.clientWidth;
    };
    const onGalScroll = () => {
      setGalIndex(Math.round(ggVp.scrollLeft / Math.max(1, galStep())));
      const max = ggVp.scrollWidth - ggVp.clientWidth;
      if (ggp) ggp.style.setProperty('--gg-scale', max > 0 ? Math.max(.12, ggVp.scrollLeft / max) : 0);
    };
    ggVp.addEventListener('scroll', () => requestAnimationFrame(onGalScroll), { passive: true });
    if (galPrev) galPrev.onclick = () => ggVp.scrollBy({ left: -galStep(), behavior: 'smooth' });
    if (galNext) galNext.onclick = () => ggVp.scrollBy({ left: galStep(), behavior: 'smooth' });
    onGalScroll();
  }
  const galGo = dir => {
    if (ggEmbla) { dir < 0 ? ggEmbla.scrollPrev() : ggEmbla.scrollNext(); }
    else if (slideCount > 1) ggVp.scrollBy({ left: dir * ggVp.clientWidth, behavior: 'smooth' });
  };

  /* ---------- dual-sticky columns (desktop) ----------
     Both columns are position:sticky (CSS ≥1025px). A column shorter than the
     viewport pins right under the header; a taller one gets a negative `top`
     so it scrolls until its BOTTOM edge pins — nothing ever clips off-page. */
  const mediaCol = qs('.pdp-media', root);
  const infoCol = qs('.pdp-info', root);
  const headerGap = () => (parseFloat(getComputedStyle(document.documentElement)
    .getPropertyValue('--header-h')) || 72) + 20;
  const pinCol = (el, bottomGap) => {
    const h = el.offsetHeight, topBar = headerGap();
    el.style.top = h <= innerHeight - topBar - bottomGap
      ? `${topBar}px`
      : `${innerHeight - h - bottomGap}px`;
  };
  const fitSticky = () => {
    if (!mediaCol || !infoCol) return;
    if (innerWidth < 1025) { mediaCol.style.top = ''; infoCol.style.top = ''; return; }
    pinCol(mediaCol, 16);
    pinCol(infoCol, 24);
  };
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(fitSticky).observe(mediaCol);
    new ResizeObserver(fitSticky).observe(infoCol);
  }
  qsa('.pdp-acc details', root).forEach(d => d.addEventListener('toggle', fitSticky));
  addEventListener('resize', fitSticky, { passive: true });
  fitSticky();
  requestAnimationFrame(fitSticky);

  /* click any media item → media lightbox (drag-guarded) */
  let galMoved = 0;
  gallery.addEventListener('pointerdown', e => {
    galMoved = 0; const gx = e.clientX;
    const gm = ev => { galMoved = Math.max(galMoved, Math.abs(ev.clientX - gx)); };
    addEventListener('pointermove', gm, { passive: true });
    addEventListener('pointerup', () => removeEventListener('pointermove', gm), { once: true });
  }, { passive: true });
  gallery.addEventListener('click', e => {
    const item = e.target.closest('.gg-item');
    if (item && galMoved < 8) mlbOpen(+item.dataset.i);
  });
  gallery.addEventListener('keydown', e => {
    const item = e.target.closest('.gg-item');
    if (item && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); mlbOpen(+item.dataset.i); return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); galGo(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); galGo(1); }
  });

  /* ---------- variants / qty / cart ---------- */
  let current = v0, qty = 1;
  const priceEl = qs('[data-price]', root), compareEl = qs('[data-compare]', root),
        saveEl = qs('[data-save]', root), availEl = qs('[data-avail]', root),
        addBtn = qs('[data-add]', root), addPrice = qs('[data-addprice]', root),
        qtyOut = qs('[data-qty]', root);

  const syncPrice = v => {
    current = v;
    priceEl.textContent = money(v.price);
    compareEl.hidden = !v.compareAt;
    saveEl.hidden = !v.compareAt;
    if (v.compareAt) { compareEl.textContent = money(v.compareAt); saveEl.textContent = `Save ${savePct(v)}%`; }
    availEl.classList.toggle('out', !v.available);
    availEl.textContent = v.available ? 'In stock — ships in 48h' : 'Sold out';
    addBtn.disabled = !v.available;
    addPrice.textContent = money(v.price * qty);
  };
  root.addEventListener('variant:change', e => syncPrice(e.detail.variant));

  qs('[data-qminus]', root).onclick = () => { qty = Math.max(1, qty - 1); qtyOut.value = qty; addPrice.textContent = money(current.price * qty); };
  qs('[data-qplus]', root).onclick = () => { qty = Math.min(9, qty + 1); qtyOut.value = qty; addPrice.textContent = money(current.price * qty); };

  const doAdd = () => {
    if (!current.available) return;
    document.dispatchEvent(new CustomEvent('cart:add', { detail: { variantId: current.id, qty } }));
  };
  addBtn.onclick = () => {
    doAdd();
    const orig = addBtn.innerHTML;
    addBtn.innerHTML = 'Added ✓';
    setTimeout(() => { addBtn.innerHTML = orig; }, 1400);
  };

  /* ============================================================
     PURITY PDP MODULES (original re-implementations)
     1) <sticky-add-cart>  2) media lightbox
     3) product-recommendations  4) <video-local-lightbox-sticky>
     ============================================================ */

  /* ---- 1. <sticky-add-cart> — floats in after buy row leaves viewport ---- */
  const sac = document.createElement('sticky-add-cart');
  sac.className = 'sticky-add-cart show-sticky-cart';
  sac.setAttribute('aria-hidden', 'true');
  sac.innerHTML = `
    <div class="sac-inner">
      <img class="sac-img" src="${p.images[0]}" alt="">
      <div class="sac-meta">
        <b>${p.title}</b>
        <span data-sac-info>${current.label} · ${money(current.price)}</span>
      </div>
      <button class="sac-add" type="button" ${current.available ? '' : 'disabled'}>
        Add to cart — <span data-sac-price>${money(current.price)}</span>
      </button>
    </div>`;
  document.body.appendChild(sac);
  const buyRow = qs('.qty-row', root);
  const sacToggle = () =>
    sac.classList.toggle('on', buyRow.getBoundingClientRect().top < 0 && scrollY > 200);
  addEventListener('scroll', () => requestAnimationFrame(sacToggle), { passive: true });
  sacToggle();
  root.addEventListener('variant:change', e => {
    const v = e.detail.variant;
    qs('[data-sac-info]', sac).textContent = `${v.label} · ${money(v.price)}`;
    qs('[data-sac-price]', sac).textContent = money(v.price);
    qs('.sac-add', sac).disabled = !v.available;
  });
  qs('.sac-add', sac).onclick = doAdd;

  /* ---- 2. media lightbox — click gallery image → immersive overlay ---- */
  const mlb = document.createElement('media-lightbox');
  mlb.id = 'block-product-media-lightbox';
  mlb.setAttribute('role', 'dialog');
  mlb.setAttribute('aria-modal', 'true');
  mlb.setAttribute('aria-hidden', 'true');
  mlb.innerHTML = `
    <div class="mlb-backdrop" data-mlb-close></div>
    <div class="mlb-stage">
      <button class="mlb-x" type="button" data-mlb-close aria-label="Close">
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l10 10M12 2 2 12"/></svg>
      </button>
      <button class="mlb-arrow prev" type="button" data-mlb-prev aria-label="Previous">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 2 4 8l6 6"/></svg>
      </button>
      <figure class="mlb-figure"></figure>
      <button class="mlb-arrow next" type="button" data-mlb-next aria-label="Next">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2l6 6-6 6"/></svg>
      </button>
      <p class="mlb-count"><span data-mlb-i>1</span> / ${slideCount}</p>
    </div>`;
  document.body.appendChild(mlb);
  const mlbFig = qs('.mlb-figure', mlb);
  let mlbI = 0;
  const mlbRender = () => {
    mlbI = (mlbI + slideCount) % slideCount;
    const isVideo = !!p.video && mlbI === slideCount - 1;
    mlbFig.innerHTML = isVideo
      ? `<video autoplay muted loop playsinline src="${p.video}" poster="${p.gallery[0]}"></video>`
      : `<img src="${p.gallery[mlbI]}" alt="${p.title} — view ${mlbI + 1}">`;
    mlbFig.animate(
      [{ opacity: .35, transform: 'scale(.975)' }, { opacity: 1, transform: 'none' }],
      { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
    qs('[data-mlb-i]', mlb).textContent = mlbI + 1;
  };
  const mlbOpen = (i = index) => {
    mlbI = i;
    mlbRender();
    mlb.classList.add('open');
    mlb.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('no-scroll');
    qsa('body > *').forEach(el => { if (el !== mlb) el.inert = true; });
  };
  const mlbClose = () => {
    mlb.classList.remove('open');
    mlb.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('no-scroll');
    qsa('body > *').forEach(el => { el.inert = false; });
    pauseVideos();
  };
  mlb.addEventListener('click', e => {
    if (e.target.closest('[data-mlb-close]')) mlbClose();
    if (e.target.closest('[data-mlb-prev]')) mlbRender(mlbI -= 1);
    if (e.target.closest('[data-mlb-next]')) mlbRender(mlbI += 1);
  });
  document.addEventListener('keydown', e => {
    if (!mlb.classList.contains('open')) return;
    if (e.key === 'Escape') mlbClose();
    if (e.key === 'ArrowLeft') mlbRender(mlbI -= 1);
    if (e.key === 'ArrowRight') mlbRender(mlbI += 1);
  });

  /* ---- "See in Action": mini video rail → lightbox playback ---- */
  const seeVp = qs('.see-action-vp', root);
  if (seeVp) {
    const track = qs('.see-action-track', root);
    const step = () => { const c = qs('.see-slide', track); return c ? c.getBoundingClientRect().width + 10 : 220; };
    const upd = () => {
      const max = seeVp.scrollWidth - seeVp.clientWidth;
      qs('[data-see-prev]', root).classList.toggle('disabled', seeVp.scrollLeft <= 2);
      qs('[data-see-next]', root).classList.toggle('disabled', seeVp.scrollLeft >= max - 2);
    };
    seeVp.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    upd();
    qs('[data-see-prev]', root).onclick = () => seeVp.scrollBy({ left: -step(), behavior: 'smooth' });
    qs('[data-see-next]', root).onclick = () => seeVp.scrollBy({ left: step(), behavior: 'smooth' });
    track.addEventListener('click', e => {
      const s = e.target.closest('[data-see-vid]');
      if (!s) return;
      mlbFig.dataset.seeVid = s.dataset.seeVid;
      mlbI = p.video ? slideCount - 1 : 0;          /* counter context */
      mlbFig.innerHTML = `<video autoplay muted loop playsinline src="${s.dataset.seeVid}" poster="${s.dataset.seePoster}"></video>`;
      qs('[data-mlb-i]', mlb).textContent = '▶';
      mlb.classList.add('open');
      mlb.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('no-scroll');
      qsa('body > *').forEach(el => { if (el !== mlb) el.inert = true; });
      tryPlaySafe(qs('video', mlbFig));
    });

    /* 3-second hover video preview on "See in Action" cards */
    qsa('.see-slide', track).forEach(slide => {
      let previewTimer = null;
      const vid = qs('.see-hover-vid', slide);
      const playBadge = qs('.see-play', slide);

      slide.addEventListener('mouseenter', () => {
        if (!vid) return;
        vid.style.display = 'block';
        tryPlaySafe(vid);
        if (playBadge) playBadge.style.opacity = '0';

        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
          vid.pause();
          try { vid.currentTime = 0; } catch {}
          vid.style.display = 'none';
          if (playBadge) playBadge.style.opacity = '';
        }, 3000); /* 3 seconds preview limit */
      });

      slide.addEventListener('mouseleave', () => {
        clearTimeout(previewTimer);
        if (vid) {
          vid.pause();
          try { vid.currentTime = 0; } catch {}
          vid.style.display = 'none';
        }
        if (playBadge) playBadge.style.opacity = '';
      });
    });
  }

  /* ---- 3. product-recommendations — "Complete the Look" vertical list + paging ---- */
  const reco = document.createElement('product-recommendations');
  reco.className = 'reco';
  const recoPool = rel.slice(0, 6);
  const PAGE = 2;
  let recoPage = 0;
  const recoRender = () => {
    const rows = recoPool.slice(recoPage * PAGE, recoPage * PAGE + PAGE).map(x => {
      const xv = x.variants.find(v => v.available) || x.variants[0];
      return `
      <article class="reco-row" data-reco="${x.id}">
        <a class="reco-thumb" href="${getProductUrl(x)}" tabindex="-1" aria-label="${x.title}">
          <img src="${x.images[0]}" alt="${x.title}" loading="lazy" decoding="async">
        </a>
        <div class="reco-row-info">
          <b>${x.title}</b>
          <span>${money(xv.price)}${xv.compareAt ? ` <s>${money(xv.compareAt)}</s>` : ''}</span>
        </div>
        <button class="reco-add-btn" type="button" data-reco-add="${xv.id}">Add</button>
      </article>`;
    }).join('');
    qs('.reco-canvas', reco).innerHTML = rows || '<p class="reco-empty">No matches.</p>';
    const maxPage = Math.max(0, Math.ceil(recoPool.length / PAGE) - 1);
    qs('[data-reco-prev]', reco).disabled = recoPage <= 0;
    qs('[data-reco-next]', reco).disabled = recoPage >= maxPage;
  };
  reco.innerHTML = `
    <div class="reco-head">
      <p class="reco-title">Complete the Look</p>
      <div class="reco-controls">
        <button type="button" data-reco-prev aria-label="Previous" disabled>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 2 4 8l6 6"/></svg>
        </button>
        <button type="button" data-reco-next aria-label="Next">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2l6 6-6 6"/></svg>
        </button>
      </div>
    </div>
    <div class="reco-canvas"></div>`;
  qs('.pdp-info', root).appendChild(reco);
  recoRender();
  qs('[data-reco-prev]', reco).onclick = () => { recoPage = Math.max(0, recoPage - 1); recoRender(); };
  qs('[data-reco-next]', reco).onclick = () => { recoPage += 1; recoRender(); };
  reco.addEventListener('click', e => {
    const qb = e.target.closest('[data-reco-add]');
    if (!qb || qb.classList.contains('done')) return;
    document.dispatchEvent(new CustomEvent('cart:add', { detail: { variantId: qb.dataset.recoAdd, qty: 1 } }));
    qb.classList.add('done');
    qb.textContent = 'Added ✓';
  });

  /* ---- 4. <video-local-lightbox-sticky> — shoppable floating mini player ---- */
  if (seeVids.length) {
    const vls = document.createElement('sticky-video');
    vls.className = 'vls';
    vls.style.setProperty('--width', '15rem');
    vls.innerHTML = `
      <div class="vls-media">
        <div class="vls-vp">
          <div class="vls-track">
            ${seeVids.map((x, i) => `
              <div class="vls-slide" data-vi="${i}">
                <video playsinline loop muted preload="none" src="${x.video}" poster="${x.gallery[0]}"></video>
              </div>`).join('')}
          </div>
        </div>
        <button class="vls-close" type="button" aria-label="Close">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 1l6 6M7 1 1 7"/></svg>
        </button>
        <div class="vls-nav">
          <button type="button" data-vls-prev aria-label="Previous video"><svg viewBox="0 0 14 8" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 7l6-6 6 6"/></svg></button>
          <button class="vls-pp" type="button" aria-label="Play">
            <svg class="ic-play" width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><path d="M0 0l10 6-10 6z"/></svg>
            <svg class="ic-pause" width="10" height="12" viewBox="0 0 10 12" fill="currentColor" style="display:none"><path d="M0 0h3v12H0zM7 0h3v12H7z"/></svg>
          </button>
          <button type="button" data-vls-next aria-label="Next video"><svg viewBox="0 0 14 8" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M1 1l6 6 6-6"/></svg></button>
        </div>
        <button class="vls-sound" type="button" aria-label="Toggle sound" aria-pressed="false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor" stroke="none"/><path class="s-on" d="M15.5 9.5a4 4 0 0 1 0 5" style="display:none"/><path class="s-off" d="M15 9.5l5 5M20 9.5l-5 5"/></svg>
        </button>
      </div>
      <div class="vls-chip">
        <span class="vls-thumb"><img data-vls-thumb src="" alt=""></span>
        <span class="vls-info"><b data-vls-name></b><span data-vls-price></span></span>
        <button class="vls-add" type="button">Add</button>
      </div>`;
    document.body.appendChild(vls);

    const vlsVp = qs('.vls-vp', vls);
    const vids = qsa('.vls-slide video', vls);
    const ppBtn = qs('.vls-pp', vls);
    let vi = seeVids.findIndex(x => x.id === p.id); if (vi < 0) vi = 0;
    let vlsOn = false, vlsKilled = false, vlsEmbla = null;

    const syncChip = () => {
      const item = seeVids[vi];
      const v0i = item.variants.find(v => v.available) || item.variants[0];
      qs('[data-vls-thumb]', vls).src = item.images[0];
      qs('[data-vls-name]', vls).textContent = item.title;
      qs('[data-vls-price]', vls).textContent = `From ${money(v0i.price)}`;
      qs('.vls-add', vls).dataset.variant = v0i.id;
    };
    const ppSync = () => {
      const a = vids[vi]; if (!a) return;
      qs('.ic-play', ppBtn).style.display = a.paused ? '' : 'none';
      qs('.ic-pause', ppBtn).style.display = a.paused ? 'none' : '';
      ppBtn.setAttribute('aria-label', a.paused ? 'Play' : 'Pause');
    };
    const syncPlay = () => {
      vids.forEach((v, i) => {
        if (i === vi && vlsOn) tryPlaySafe(v);
        else { v.pause(); try { v.currentTime = 0; } catch {} }
      });
      ppSync();
    };

    /* TikTok-style vertical swipe — Embla axis:'y', native snap fallback */
    try {
      if (window.EmblaCarousel && seeVids.length > 1) {
        vlsEmbla = window.EmblaCarousel(vlsVp, { axis: 'y', loop: true, align: 'start' });
      }
    } catch { vlsEmbla = null; }
    if (vlsEmbla) {
      vlsVp.classList.add('is-embla');
      vlsEmbla.on('select', () => { vi = vlsEmbla.selectedScrollSnap(); syncChip(); syncPlay(); });
      if (vi) vlsEmbla.scrollTo(vi, true);
    } else if (seeVids.length > 1) {
      vlsVp.scrollTop = vi * vlsVp.clientHeight;
      vlsVp.addEventListener('scroll', () => requestAnimationFrame(() => {
        const i = Math.round(vlsVp.scrollTop / Math.max(1, vlsVp.clientHeight));
        if (i !== vi && vids[i]) { vi = i; syncChip(); syncPlay(); }
      }), { passive: true });
    }

    const vlsToggle = () => {
      if (vlsKilled) return;
      const past = buyRow.getBoundingClientRect().top < 0 && scrollY > 200;
      if (past !== vlsOn) {
        vlsOn = past;
        vls.classList.toggle('active', vlsOn);
        syncPlay();
      }
    };
    addEventListener('scroll', () => requestAnimationFrame(vlsToggle), { passive: true });
    syncChip(); syncPlay(); vlsToggle();

    ppBtn.onclick = () => { const a = vids[vi]; if (!a) return; a.paused ? tryPlaySafe(a) : a.pause(); ppSync(); };
    vids.forEach(v => v.addEventListener('click', () => ppBtn.click()));
    qs('.vls-sound', vls).onclick = e => {
      const a = vids[vi]; if (!a) return;
      a.muted = !a.muted;
      const b = e.currentTarget;
      b.setAttribute('aria-pressed', String(!a.muted));
      qs('.s-on', b).style.display = a.muted ? 'none' : '';
      qs('.s-off', b).style.display = a.muted ? '' : 'none';
      tryPlaySafe(a);
    };
    qs('[data-vls-prev]', vls).onclick = () =>
      vlsEmbla ? vlsEmbla.scrollPrev() : vlsVp.scrollBy({ top: -vlsVp.clientHeight, behavior: 'smooth' });
    qs('[data-vls-next]', vls).onclick = () =>
      vlsEmbla ? vlsEmbla.scrollNext() : vlsVp.scrollBy({ top: vlsVp.clientHeight, behavior: 'smooth' });
    qs('.vls-add', vls).addEventListener('click', e => {
      const b = e.currentTarget;
      document.dispatchEvent(new CustomEvent('cart:add', { detail: { variantId: b.dataset.variant, qty: 1 } }));
      if (!b.classList.contains('done')) {
        b.classList.add('done'); b.textContent = 'Added ✓';
        setTimeout(() => { b.classList.remove('done'); b.textContent = 'Add'; }, 1400);
      }
    });
    qs('.vls-close', vls).onclick = () => {
      vlsKilled = true;
      vids.forEach(v => v.pause());
      if (vlsEmbla) vlsEmbla.destroy();
      vls.classList.remove('active');
      setTimeout(() => vls.remove(), 450);
    };
  }

  /* ---------- related products (rel list already built above for reco) ---------- */
  const relGrid = qs('#related-grid');
  if (relGrid) {
    relGrid.innerHTML = rel.slice(0, 4).map((x, i) =>
      `<product-card product="${x.id}" data-reveal style="--d:${i * 100}ms"></product-card>`).join('');
  }

  /* ---------- campaigns sync ---------- */
  if (liveData && Array.isArray(liveData.campaigns) && liveData.campaigns.length > 0) {
    const campGrid = qs('.camp-grid');
    if (campGrid) {
      campGrid.innerHTML = liveData.campaigns.map((c, idx) => `
        <div class="camp-card ${c.bg_class || 'camp-ticket'}" data-reveal style="--d:${idx * 120}ms">
          <p class="camp-kicker">${c.kicker}</p>
          <h3>${c.title}</h3>
          ${c.coupon_code ? `
            <div class="coupon-row">
              <span class="coupon-code">${c.coupon_code}</span>
              <button class="coupon-copy" data-copy="${c.coupon_code}">Copy</button>
            </div>
          ` : ''}
          ${c.has_countdown ? `<p class="camp-timer">Deal refreshes in <b data-flash-timer>—:—:—</b></p>` : ''}
          ${c.description ? `<p>${c.description}</p>` : ''}
          ${c.cta_label ? `<a class="camp-cta" href="${c.cta_link || 'index.html#shop'}">${c.cta_label} <span class="btn-arrow">→</span></a>` : ''}
        </div>
      `).join('');
    }
  }

  /* dynamic [data-reveal] elements need a pass — whole document,
     because the related grid lives OUTSIDE #pdp-root */
  if (typeof initReveals === 'function') initReveals();

  /* ---------- Lenis Smooth Scroll on PDP & pdp-desc ---------- */
  initPdpLenis();
}

function initPdpLenis() {
  // 1. Initialize global page Lenis if available
  if (typeof Lenis !== 'undefined' && !window._globalLenis) {
    try {
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.5,
      });
      window._globalLenis = lenis;

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    } catch (e) {
      console.warn('Lenis init:', e);
    }
  }

  // 2. pdp-desc ultra-smooth momentum scroll & random soft word highlighter
  const descWrap = qs('.pdp-desc-wrap');
  const descEl = qs('.pdp-desc');

  if (descWrap && descEl) {
    const updateFade = () => {
      const isEnd = descEl.scrollTop + descEl.clientHeight >= descEl.scrollHeight - 8;
      descWrap.classList.toggle('is-scrolled-end', isEnd);
    };

    descEl.addEventListener('scroll', updateFade, { passive: true });
    setTimeout(updateFade, 50);

    /* --- Butter-smooth Momentum Inertia Scrolling --- */
    let targetScrollY = descEl.scrollTop;
    let currentScrollY = descEl.scrollTop;
    let isWheeling = false;
    let rafId = null;

    const smoothScrollLoop = () => {
      const diff = targetScrollY - currentScrollY;
      if (Math.abs(diff) > 0.3) {
        currentScrollY += diff * 0.14; // Ultra-smooth ease interpolation
        descEl.scrollTop = currentScrollY;
        updateFade();
        rafId = requestAnimationFrame(smoothScrollLoop);
      } else {
        descEl.scrollTop = targetScrollY;
        currentScrollY = targetScrollY;
        isWheeling = false;
        cancelAnimationFrame(rafId);
        rafId = null;
        updateFade();
      }
    };

    descEl.addEventListener('wheel', (e) => {
      const maxScroll = descEl.scrollHeight - descEl.clientHeight;
      if (maxScroll <= 0) return;

      const delta = e.deltaY;
      const atTop = descEl.scrollTop <= 0;
      const atBottom = descEl.scrollTop >= maxScroll - 1;

      // Isolate scroll inside description box
      if ((delta > 0 && !atBottom) || (delta < 0 && !atTop)) {
        e.preventDefault();
        e.stopPropagation();

        if (!isWheeling) {
          currentScrollY = descEl.scrollTop;
          targetScrollY = descEl.scrollTop;
          isWheeling = true;
        }

        targetScrollY = Math.max(0, Math.min(maxScroll, targetScrollY + delta * 0.85));

        if (!rafId) {
          rafId = requestAnimationFrame(smoothScrollLoop);
        }
      }
    }, { passive: false });

    /* --- Dynamic Random Soft Word Highlighter --- */
    initWordHighlighter(descEl);
  }
}

function initWordHighlighter(container) {
  // Vibrant but natural transparent highlighter ink tones
  const INK_COLORS = [
    'rgba(255, 235, 59, 0.45)',  // Sarı / Fluorescent Yellow
    'rgba(105, 240, 174, 0.42)', // Yeşil / Mint Green
    'rgba(255, 110, 199, 0.38)', // Pembe / Neon Pink
    'rgba(255, 171, 64, 0.42)',  // Turuncu / Bright Orange
    'rgba(0, 229, 255, 0.40)',   // Cam Göbeği / Cyan
    'rgba(179, 136, 255, 0.40)', // Mor / Violet
    'rgba(68, 138, 255, 0.38)',  // Mavi / Sky Blue
  ];

  // Wrap all eligible text words in <span class="pdp-w">
  const wrapWords = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      const parts = text.split(/(\s+|[.,;!?()]+)/);
      parts.forEach(part => {
        if (part && /^[a-zA-ZçÇğĞıİöÖşŞüÜ0-9]{2,}$/.test(part)) {
          const span = document.createElement('span');
          span.className = 'pdp-w';
          span.textContent = part;
          frag.appendChild(span);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE && !['SCRIPT', 'STYLE'].includes(node.tagName)) {
      [...node.childNodes].forEach(wrapWords);
    }
  };

  wrapWords(container);

  const words = qsa('.pdp-w', container);
  if (!words.length) return;

  let currentIndex = 0;
  let activeSpan = null;
  let readingTimer = null;
  let currentColor = INK_COLORS[0];

  const clearActive = () => {
    if (activeSpan) {
      activeSpan.classList.remove('pdp-hl');
      activeSpan.style.removeProperty('--hl-color');
      activeSpan = null;
    }
  };

  const advanceWord = () => {
    clearActive();

    if (currentIndex >= words.length) {
      currentIndex = 0; // Metin bittiğinde başa sar
      currentColor = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
    }

    const wordEl = words[currentIndex];
    if (!wordEl) return;

    // Her cümle/paragraf geçişinde veya ara ara farklı bir fosforlu renk seç
    if (currentIndex % 7 === 0) {
      currentColor = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
    }

    wordEl.style.setProperty('--hl-color', currentColor);
    wordEl.classList.add('pdp-hl');
    activeSpan = wordEl;

    // Otomatik görünürlük takibi: Vurgulanan kelime aşağıda kalmışsa yumuşakça odakla
    const cRect = container.getBoundingClientRect();
    const wRect = wordEl.getBoundingClientRect();
    if (wRect.bottom > cRect.bottom - 15) {
      container.scrollTop += (wRect.bottom - cRect.bottom + 25);
    } else if (wRect.top < cRect.top + 10) {
      container.scrollTop -= (cRect.top - wRect.top + 15);
    }

    currentIndex++;

    // Doğal insan okuma hızı (ortalama ~220 WPM -> kelime uzunluğuna göre 210-320ms aralığı)
    const wordLength = wordEl.textContent.length;
    const readDelay = Math.max(180, Math.min(380, wordLength * 38 + 170));

    if (readingTimer) {
      readingTimer = setTimeout(advanceWord, readDelay);
    }
  };

  // Mouse açıklama alanına girince en baştan (veya kalınan yerden) okuma akışını başlat
  container.addEventListener('mouseenter', () => {
    if (!readingTimer) {
      readingTimer = setTimeout(advanceWord, 100);
    }
  });

  // Mouse alandan ayrılınca okuma durur ve vurgu yumuşakça kaybolur
  container.addEventListener('mouseleave', () => {
    if (readingTimer) {
      clearTimeout(readingTimer);
      readingTimer = null;
    }
    clearActive();
  });
}

document.addEventListener('DOMContentLoaded', () => renderPDP());
document.addEventListener('catalog:live', e => renderPDP(e.detail));

