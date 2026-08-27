/* ============================================================
   FROND — Dedicated Cart Page Controller (assets/cart.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.loadCatalogData === 'function') {
    await window.loadCatalogData();
  }

  const tableWrap = document.getElementById('cart-items-table');
  const emptyState = document.getElementById('cart-empty-state');
  const summaryCard = document.getElementById('cart-summary-card');
  const subtotalEl = document.getElementById('summary-subtotal');
  const totalEl = document.getElementById('summary-total');
  const shipMsgEl = document.getElementById('cart-ship-msg');
  const shipBarFill = document.getElementById('cart-ship-bar-fill');
  const couponInput = document.getElementById('cart-coupon-input');
  const btnApplyCoupon = document.getElementById('btn-apply-coupon');
  const couponFeedback = document.getElementById('coupon-feedback');

  let appliedDiscount = 0; // percentage e.g. 0.10

  function renderCartPage() {
    const items = Cart.items || [];

    if (items.length === 0) {
      if (tableWrap) tableWrap.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      if (summaryCard) summaryCard.style.display = 'none';
      if (shipMsgEl) shipMsgEl.parentElement.style.display = 'none';
      return;
    }

    if (tableWrap) tableWrap.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (summaryCard) summaryCard.style.display = 'block';
    if (shipMsgEl) shipMsgEl.parentElement.style.display = 'block';

    // Render items table
    tableWrap.innerHTML = `
      <div class="cart-items-list">
        ${items.map(item => {
          const hit = findVariant(item.variantId);
          if (!hit) return '';
          const { product: p, variant: v } = hit;
          const lineTotal = v.price * item.qty;
          const imgUrl = p.images?.[0] || '/assets/img/p-monstera-1.jpg';

          return `
            <div class="cart-item-row" data-vid="${v.id}">
              <img class="cart-item-img" src="${imgUrl}" alt="${p.title}">
              <div class="cart-item-info">
                <h3 class="cart-item-title"><a href="${getProductUrl(p)}">${p.title}</a></h3>
                <div class="cart-item-variant">${v.label !== 'Standard' ? v.label : ''}</div>
                <button type="button" class="cart-item-remove" data-remove="${v.id}">Remove</button>
              </div>
              <div class="cart-qty-ctrl">
                <button type="button" data-minus="${v.id}" aria-label="Decrease quantity">&minus;</button>
                <span>${item.qty}</span>
                <button type="button" data-plus="${v.id}" aria-label="Increase quantity">&plus;</button>
              </div>
              <div class="cart-item-price-col">
                <span class="cart-item-price">${money(lineTotal)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Calculate totals
    const subtotal = Cart.total();
    const freeThreshold = getFreeShipThreshold();
    const diff = freeThreshold - subtotal;

    if (diff <= 0) {
      shipMsgEl.innerHTML = `🎉 <b>You've unlocked Free Greenhouse Shipping!</b>`;
      shipBarFill.style.width = '100%';
    } else {
      shipMsgEl.innerHTML = `Add <b>${money(diff)}</b> more for free greenhouse shipping!`;
      const pct = Math.min(100, Math.max(8, (subtotal / freeThreshold) * 100));
      shipBarFill.style.width = `${pct}%`;
    }

    subtotalEl.textContent = money(subtotal);
    const finalTotal = subtotal * (1 - appliedDiscount);
    totalEl.textContent = money(finalTotal);
  }

  // Event delegation for cart actions
  if (tableWrap) {
    tableWrap.addEventListener('click', e => {
      const minusBtn = e.target.closest('[data-minus]');
      const plusBtn = e.target.closest('[data-plus]');
      const remBtn = e.target.closest('[data-remove]');

      if (minusBtn) {
        const vid = minusBtn.dataset.minus;
        const line = Cart.items.find(i => i.variantId === vid);
        if (line) Cart.setQty(vid, line.qty - 1);
        renderCartPage();
      } else if (plusBtn) {
        const vid = plusBtn.dataset.plus;
        const line = Cart.items.find(i => i.variantId === vid);
        if (line) Cart.setQty(vid, line.qty + 1);
        renderCartPage();
      } else if (remBtn) {
        const vid = remBtn.dataset.remove;
        Cart.remove(vid);
        renderCartPage();
      }
    });
  }

  // Coupon handling
  if (btnApplyCoupon && couponInput) {
    btnApplyCoupon.addEventListener('click', () => {
      const code = couponInput.value.trim().toUpperCase();
      if (code === 'WELCOME10' || code === 'GREEN10') {
        appliedDiscount = 0.10;
        couponFeedback.innerHTML = `<span style="color:var(--moss); font-size:.84rem; display:block; margin-top:.4rem;">✓ 10% Greenhouse discount applied!</span>`;
        renderCartPage();
      } else if (code === 'FROND20') {
        appliedDiscount = 0.20;
        couponFeedback.innerHTML = `<span style="color:var(--moss); font-size:.84rem; display:block; margin-top:.4rem;">✓ 20% Botanist Club discount applied!</span>`;
        renderCartPage();
      } else if (code) {
        couponFeedback.innerHTML = `<span style="color:#DC2626; font-size:.84rem; display:block; margin-top:.4rem;">Invalid promo code.</span>`;
      }
    });
  }

  // ═══════════════════════════════════════════════════════
  // Upsell / Cross-sell Carousel Renderer
  // ═══════════════════════════════════════════════════════
  const upsellTrack = document.getElementById('cart-upsell-track');
  const upsellVp = document.getElementById('cart-upsell-embla-vp');
  const btnUpsellPrev = document.getElementById('upsell-prev');
  const btnUpsellNext = document.getElementById('upsell-next');
  let emblaUpsell = null;

  function renderUpsellCarousel() {
    if (!upsellTrack) return;
    const allProds = window.PRODUCTS || [];
    const inCartIds = (Cart.items || []).map(i => {
      const hit = findVariant(i.variantId);
      return hit?.product?.id;
    }).filter(Boolean);

    // Filter products not already in cart, prioritize accessories / pots / easy plants
    let candidates = allProds.filter(p => !inCartIds.includes(p.id));
    if (candidates.length < 3) candidates = allProds;

    upsellTrack.innerHTML = candidates.map(p => {
      const v0 = p.variants?.[0] || { price: 3400, id: p.id };
      const img = p.images?.[0] || '/assets/img/p-monstera-1.jpg';
      const perk = p.care?.light || p.chips?.[0] || 'Botanical essential';

      return `
        <div class="cart-upsell-slide">
          <div class="mini-upsell-card">
            <div class="mini-upsell-media">
              <img src="${img}" alt="${p.title}" loading="lazy">
              ${p.bestseller ? `<span class="mini-upsell-badge">Popular</span>` : ''}
            </div>
            <div class="mini-upsell-info">
              <h4><a href="${getProductUrl(p)}">${p.title}</a></h4>
              <p class="mini-upsell-perk">🌿 ${perk}</p>
              <div class="mini-upsell-foot">
                <span class="mini-upsell-price">${money(v0.price)}</span>
                <button type="button" class="btn-mini-add" data-upsell-add="${v0.id}">
                  <span>Add</span> <span>+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners for quick-add
    upsellTrack.querySelectorAll('[data-upsell-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const vid = btn.dataset.upsellAdd;
        Cart.add(vid, 1);
        btn.innerHTML = `<span>Added</span> ✓`;
        btn.style.background = 'var(--moss)';
        btn.style.borderColor = 'var(--moss)';
        setTimeout(() => {
          renderCartPage();
          renderUpsellCarousel();
        }, 300);
      });
    });

    // Initialize or re-init Embla
    const Embla = window.EmblaCarousel || window.emblaCarousel;
    if (upsellVp && typeof Embla === 'function') {
      if (emblaUpsell) emblaUpsell.destroy();
      emblaUpsell = Embla(upsellVp, {
        loop: true,
        align: 'start',
        dragFree: true,
        containScroll: 'trimSnaps'
      });

      if (btnUpsellPrev) btnUpsellPrev.onclick = () => emblaUpsell.scrollPrev();
      if (btnUpsellNext) btnUpsellNext.onclick = () => emblaUpsell.scrollNext();
    }
  }

  document.addEventListener('cart:updated', () => {
    renderCartPage();
    renderUpsellCarousel();
  });

  renderCartPage();
  renderUpsellCarousel();
});
