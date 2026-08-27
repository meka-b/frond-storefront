/* ============================================================
   FROND — Customer Account & Dashboard Controller (assets/account.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.loadCatalogData === 'function') {
    await window.loadCatalogData();
  }

  // Sample User Orders Data
  const MOCK_ORDERS = [
    {
      id: 'FR-94821',
      date: 'Aug 24, 2026',
      status: 'In Greenhouse Preparation',
      total: '$88.00',
      items: [
        { title: 'Monstera Deliciosa (Terracotta)', qty: 1, price: '$58.00', img: '/assets/img/p-monstera-1.jpg' },
        { title: 'Dune Ceramic Planter (Sand)', qty: 1, price: '$30.00', img: '/assets/img/p-planter-1.jpg' }
      ]
    },
    {
      id: 'FR-88301',
      date: 'Jul 12, 2026',
      status: 'Delivered &amp; Root Thriving',
      total: '$42.00',
      items: [
        { title: 'Golden Pothos (Nursery Pot)', qty: 1, price: '$42.00', img: '/assets/img/p-pothos-1.jpg' }
      ]
    }
  ];

  // User Saved Addresses (Mutable)
  const savedAddresses = [
    {
      id: 'addr-1',
      isDefault: true,
      title: 'Home / Loft',
      recipient: 'Jane Doe',
      street: '123 Botanical Way, Apt 4B',
      cityStateZip: 'San Francisco, CA 94107',
      phone: '+1 (555) 019-2834'
    },
    {
      id: 'addr-2',
      isDefault: false,
      title: 'Design Studio',
      recipient: 'Jane Doe (Office)',
      street: '88 Studio Lane, Suite 200',
      cityStateZip: 'San Francisco, CA 94103',
      phone: '+1 (555) 019-5555'
    }
  ];

  // Sample User Living Plants
  const MOCK_PLANTS = [
    {
      name: 'Monstera Deliciosa',
      location: 'Living Room (East Window)',
      waterSchedule: 'Every 7-9 days (When top 3cm dries)',
      light: 'Bright Indirect Light',
      img: '/assets/img/p-monstera-1.jpg',
      lastWatered: '3 days ago'
    },
    {
      name: 'Golden Pothos',
      location: 'Bookshelf / Cascading',
      waterSchedule: 'Every 10 days',
      light: 'Low to Medium Light',
      img: '/assets/img/p-pothos-1.jpg',
      lastWatered: '1 day ago'
    },
    {
      name: 'Fiddle-Leaf Fig',
      location: 'Dining Corner',
      waterSchedule: 'Weekly + leaf misting',
      light: 'Bright Filtered Sunlight',
      img: '/assets/img/p-fig-1.jpg',
      lastWatered: '5 days ago'
    }
  ];

  // Tab Navigation
  const tabBtns = document.querySelectorAll('.acc-tab-btn');
  const panels = document.querySelectorAll('.acc-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.dataset.target;
      const targetPanel = document.getElementById(`panel-${target}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Render Orders
  const ordersList = document.getElementById('acc-orders-list');
  if (ordersList) {
    ordersList.innerHTML = MOCK_ORDERS.map(ord => `
      <div class="acc-order-card">
        <div class="acc-order-header">
          <div>
            <span style="font-family:var(--font-display); font-weight:600; font-size:1.05rem; color:var(--ink);">${ord.id}</span>
            <span style="color:var(--ink-40); margin:0 .4rem;">&bull;</span>
            <span style="color:var(--ink-60); font-size:.85rem;">Placed on ${ord.date}</span>
          </div>
          <div style="display:flex; align-items:center; gap:1rem;">
            <span class="acc-order-status-badge">${ord.status}</span>
            <span style="font-weight:600; font-size:1.05rem; color:var(--ink);">${ord.total}</span>
          </div>
        </div>
        <div class="acc-order-items" style="display:flex; flex-direction:column; gap:.8rem;">
          ${ord.items.map(item => `
            <div class="acc-order-item-row">
              <img src="${item.img}" alt="${item.title}">
              <div class="info">
                <h4>${item.title}</h4>
                <p>Qty: ${item.qty}</p>
              </div>
              <div class="price">${item.price}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // Render Addresses Function
  const addressesGrid = document.getElementById('acc-addresses-grid');
  function renderAddresses() {
    if (!addressesGrid) return;
    addressesGrid.innerHTML = savedAddresses.map(addr => `
      <div class="acc-address-card">
        <div>
          ${addr.isDefault ? `<span class="top-badge">Default</span>` : ''}
          <h3>${addr.title}</h3>
          <p class="recipient">${addr.recipient}</p>
          <p class="details">${addr.street}<br>${addr.cityStateZip}</p>
        </div>
        <p class="phone">${addr.phone}</p>
      </div>
    `).join('');
  }
  renderAddresses();

  // Render Plant Care Reminders
  const plantsGrid = document.getElementById('acc-plants-grid');
  if (plantsGrid) {
    plantsGrid.innerHTML = MOCK_PLANTS.map(pl => `
      <div class="acc-plant-card">
        <img src="${pl.img}" alt="${pl.name}">
        <div class="plant-info">
          <h4>${pl.name}</h4>
          <p>📍 ${pl.location}</p>
          <div class="care-badge">
            💧 <b>Water:</b> ${pl.waterSchedule}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Address Modal Interactions
  const modalBackdrop = document.getElementById('address-modal');
  const btnAddAddress = document.getElementById('btn-add-address');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const addAddressForm = document.getElementById('add-address-form');

  function openAddressModal() {
    if (modalBackdrop) modalBackdrop.style.display = 'flex';
  }
  function closeAddressModal() {
    if (modalBackdrop) {
      modalBackdrop.style.display = 'none';
      if (addAddressForm) addAddressForm.reset();
    }
  }

  if (btnAddAddress) btnAddAddress.addEventListener('click', openAddressModal);
  if (btnCloseModal) btnCloseModal.addEventListener('click', closeAddressModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeAddressModal);

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeAddressModal();
    });
  }

  if (addAddressForm) {
    addAddressForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('modal-addr-title')?.value || 'Secondary Address';
      const name = document.getElementById('modal-addr-name')?.value || 'Jane Doe';
      const street = document.getElementById('modal-addr-street')?.value || '';
      const city = document.getElementById('modal-addr-city')?.value || '';
      const zip = document.getElementById('modal-addr-zip')?.value || '';
      const phone = document.getElementById('modal-addr-phone')?.value || '';

      savedAddresses.push({
        id: `addr-${Date.now()}`,
        isDefault: false,
        title,
        recipient: name,
        street,
        cityStateZip: `${city} ${zip}`,
        phone
      });

      renderAddresses();
      closeAddressModal();
    });
  }
});
