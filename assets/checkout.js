/* ============================================================
   FROND — Dedicated Checkout Page Controller (assets/checkout.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.loadCatalogData === 'function') {
    await window.loadCatalogData();
  }

  const itemsList = document.getElementById('chk-items-list');
  const itemsCountEl = document.getElementById('chk-items-count');
  const subtotalEl = document.getElementById('chk-subtotal');
  const shippingEl = document.getElementById('chk-shipping');
  const totalEl = document.getElementById('chk-total');
  const btnTotalEl = document.getElementById('btn-order-total');
  const checkoutForm = document.getElementById('checkout-form');
  const feedbackEl = document.getElementById('checkout-feedback');
  const payTabs = document.querySelectorAll('.pay-tab');
  const deliveryOpts = document.querySelectorAll('.delivery-opt-card');

  let shippingCost = 0; // 0 or 1800 (cents)

  function renderCheckoutSummary() {
    const items = Cart.items || [];
    const count = Cart.count();

    if (itemsCountEl) itemsCountEl.textContent = count;

    if (items.length === 0) {
      if (itemsList) {
        itemsList.innerHTML = `
          <div style="padding:1.5rem 0; text-align:center; color:var(--ink-60);">
            Your cart is empty. <a href="/collections" style="color:var(--moss); text-decoration:underline;">Browse plants</a>
          </div>
        `;
      }
      return;
    }

    if (itemsList) {
      itemsList.innerHTML = items.map(item => {
        const hit = findVariant(item.variantId);
        if (!hit) return '';
        const { product: p, variant: v } = hit;
        const lineTotal = v.price * item.qty;
        const imgUrl = p.images?.[0] || '/assets/img/p-monstera-1.jpg';

        return `
          <div class="chk-item-row">
            <img src="${imgUrl}" alt="${p.title}">
            <div>
              <div style="font-weight:500; font-size:.92rem; color:var(--ink);">${p.title}</div>
              <div style="font-size:.8rem; color:var(--ink-60);">Qty: ${item.qty} &bull; ${v.label}</div>
            </div>
            <div style="font-weight:600; font-size:.95rem; color:var(--ink);">${money(lineTotal)}</div>
          </div>
        `;
      }).join('');
    }

    const subtotal = Cart.total();
    const finalDue = subtotal + shippingCost;

    if (subtotalEl) subtotalEl.textContent = money(subtotal);
    if (shippingEl) shippingEl.textContent = shippingCost === 0 ? 'Free' : money(shippingCost);
    if (totalEl) totalEl.textContent = money(finalDue);
    if (btnTotalEl) btnTotalEl.textContent = money(finalDue);
  }

  // Delivery method selection
  deliveryOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      deliveryOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        shippingCost = radio.value === 'express' ? 1800 : 0;
        renderCheckoutSummary();
      }
    });
  });

  // Payment tab switching
  payTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      payTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Form submission / Order placement
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', e => {
      e.preventDefault();
      
      const email = document.getElementById('chk-email')?.value;
      const fname = document.getElementById('chk-fname')?.value;
      const address = document.getElementById('chk-address')?.value;

      if (!email || !fname || !address) {
        alert('Please fill in your shipping information.');
        return;
      }

      const btn = document.getElementById('btn-place-order');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `Processing Secure Payment...`;
      }

      setTimeout(() => {
        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.innerHTML = `
            <div style="font-size:2rem; margin-bottom:.5rem;">🎉</div>
            <h3 style="font-family:var(--font-display); font-size:1.35rem; color:var(--ink); margin-bottom:.4rem;">Order Confirmed!</h3>
            <p style="font-size:.9rem; color:var(--ink-60); margin-bottom:1.2rem;">Thank you, ${fname}! We are preparing your living plants for climate-safe dispatch. Order receipt sent to <b>${email}</b>.</p>
            <a href="/account" class="btn" style="padding:.7rem 1.4rem; font-size:.9rem;">View Order in Dashboard &rarr;</a>
          `;
        }
        Cart.clear();
      }, 1200);
    });
  }

  renderCheckoutSummary();
});
