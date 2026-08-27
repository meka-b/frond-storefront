/* ============================================================
   FROND — Admin Panel & Better Auth Controller (assets/admin.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const authModal = document.getElementById('auth-modal');
  const adminApp = document.getElementById('admin-app');
  const loginForm = document.getElementById('admin-login-form');
  const authError = document.getElementById('auth-error');
  const btnLoginSubmit = document.getElementById('btn-login-submit');
  const btnLogout = document.getElementById('btn-logout');

  // 1. Check current session status
  async function checkSession() {
    try {
      const res = await fetch('/api/auth/get-session');
      const data = await res.json();

      if (data && data.user) {
        // User is logged in
        authModal.style.display = 'none';
        adminApp.style.display = 'grid';
        document.getElementById('adm-profile-name').textContent = data.user.name || 'Frond Admin';
        document.getElementById('adm-profile-email').textContent = data.user.email || 'admin@mail.com';
        loadDashboardData();
      } else {
        // Show login modal
        authModal.style.display = 'flex';
        adminApp.style.display = 'none';
      }
    } catch (err) {
      // Fallback: If edge session check fails or offline, show login modal
      authModal.style.display = 'flex';
      adminApp.style.display = 'none';
    }
  }

  // 2. Handle Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      authError.style.display = 'none';
      btnLoginSubmit.disabled = true;
      btnLoginSubmit.innerHTML = '<span>Doğrulanıyor...</span>';

      const email = document.getElementById('adm-email').value.trim();
      const password = document.getElementById('adm-password').value;

      try {
        const res = await fetch('/api/auth/sign-in/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const result = await res.json();

        if (res.ok && result.success) {
          // Success
          authModal.style.display = 'none';
          adminApp.style.display = 'grid';
          document.getElementById('adm-profile-name').textContent = result.user.name;
          document.getElementById('adm-profile-email').textContent = result.user.email;
          loadDashboardData();
        } else {
          authError.textContent = result.error || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
          authError.style.display = 'block';
        }
      } catch (err) {
        // Fallback for static demo environments if server isn't running
        if (email === 'admin@mail.com' && password === '123456') {
          authModal.style.display = 'none';
          adminApp.style.display = 'grid';
          loadDashboardData();
        } else {
          authError.textContent = 'Giriş başarısız: ' + err.message;
          authError.style.display = 'block';
        }
      } finally {
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.innerHTML = '<span>Güvenli Giriş Yap</span><span class="btn-arrow">&rarr;</span>';
      }
    });
  }

  // 3. Handle Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      if (confirm('Yönetim panelinden çıkış yapmak istediğinize emin misiniz?')) {
        try {
          await fetch('/api/auth/sign-out', { method: 'POST' });
        } catch (e) {}
        window.location.reload();
      }
    });
  }

  // 4. Load Dashboard Content (Products, Orders, KPIs)
  async function loadDashboardData() {
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      const products = data.products || [];

      // Update KPI
      document.getElementById('kpi-products').textContent = products.length;

      // Render Products Table
      const prodTbody = document.getElementById('adm-products-tbody');
      if (prodTbody) {
        prodTbody.innerHTML = products.map(p => {
          const img = p.images && p.images[0] ? p.images[0] : '/assets/img/p-monstera-1.jpg';
          const priceStr = p.variants && p.variants[0] ? '$' + (p.variants[0].price / 100).toFixed(2) : '$45.00';
          const chipsStr = (p.chips || []).join(', ') || 'Botanical';
          
          return `
            <tr>
              <td>
                <div style="display:flex; align-items:center; gap:.8rem;">
                  <img src="${img}" style="width:42px; height:42px; border-radius:8px; object-fit:cover; border:1px solid #E8E6DF;">
                  <div>
                    <b style="font-size:.88rem; color:#1D2A1C;">${p.title}</b>
                    <div style="font-size:.75rem; color:#7A8377;">${p.subtitle || ''}</div>
                  </div>
                </div>
              </td>
              <td><span style="font-family:monospace; font-size:.78rem;">${p.id}</span></td>
              <td><b style="color:#1D2A1C;">${priceStr}</b></td>
              <td><span class="adm-badge adm-badge-success">Stokta Var</span></td>
              <td>${p.badge ? `<span class="adm-badge adm-badge-warning">${p.badge}</span>` : '—'}</td>
              <td>
                <a href="/plants/foliage/${p.id}" target="_blank" class="adm-btn-sm">Storefront'ta Gör</a>
              </td>
            </tr>
          `;
        }).join('');
      }

      // Render Mock Orders
      const orderTbody = document.getElementById('adm-orders-tbody');
      if (orderTbody) {
        orderTbody.innerHTML = `
          <tr>
            <td><span style="font-family:monospace; font-weight:600;">FR-94821</span></td>
            <td><b>Jane Doe</b> <span style="font-size:.75rem; color:#7A8377;">(SF Loft)</span></td>
            <td><b>$88.00</b></td>
            <td><span class="adm-badge adm-badge-success">Ödendi (Stripe)</span></td>
            <td style="color:#7A8377;">24 Ağu 2026</td>
          </tr>
          <tr>
            <td><span style="font-family:monospace; font-weight:600;">FR-88301</span></td>
            <td><b>Alex Morgan</b> <span style="font-size:.75rem; color:#7A8377;">(Design Studio)</span></td>
            <td><b>$42.00</b></td>
            <td><span class="adm-badge adm-badge-success">Ödendi (Apple Pay)</span></td>
            <td style="color:#7A8377;">12 Tem 2026</td>
          </tr>
        `;
      }
    } catch (err) {
      console.warn('Dashboard data fetch error:', err);
    }
  }

  // 5. Tab Navigation
  document.querySelectorAll('.adm-nav-link[data-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = btn.dataset.tab;
      document.querySelectorAll('.adm-nav-link').forEach(l => l.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.adm-tab-content').forEach(c => c.style.display = 'none');
      if (tab === 'password') {
        document.getElementById('view-password').style.display = 'block';
        document.getElementById('adm-view-title').textContent = 'Şifre & Güvenlik';
        document.getElementById('adm-view-desc').textContent = 'Yönetici oturum şifresini ve erişim yetkilerini güncelleyin.';
      } else {
        document.getElementById('view-dashboard').style.display = 'block';
        document.getElementById('adm-view-title').textContent = 'Kontrol Paneli';
        document.getElementById('adm-view-desc').textContent = 'Mağaza metrikleri, canlı stok durumları ve son müşteri siparişleri.';
      }
    });
  });

  // 6. Change Password Form
  const formChangePwd = document.getElementById('form-change-pwd');
  if (formChangePwd) {
    formChangePwd.addEventListener('submit', async (e) => {
      e.preventDefault();
      const curr = document.getElementById('pwd-curr').value;
      const next = document.getElementById('pwd-new').value;
      const msg = document.getElementById('pwd-msg');

      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: curr, newPassword: next })
        });
        const d = await res.json();
        if (res.ok) {
          msg.style.display = 'block';
          msg.style.background = '#ECFDF5';
          msg.style.color = '#059669';
          msg.style.border = '1px solid #A7F3D0';
          msg.textContent = d.message || 'Şifre başarıyla güncellendi!';
          formChangePwd.reset();
        } else {
          msg.style.display = 'block';
          msg.style.background = '#FEF2F2';
          msg.style.color = '#DC2626';
          msg.style.border = '1px solid #FECACA';
          msg.textContent = d.error || 'Şifre güncellenemedi.';
        }
      } catch (err) {
        msg.style.display = 'block';
        msg.style.background = '#FEF2F2';
        msg.style.color = '#DC2626';
        msg.style.border = '1px solid #FECACA';
        msg.textContent = 'Bağlantı hatası: ' + err.message;
      }
    });
  }

  // Initialize
  checkSession();
});
