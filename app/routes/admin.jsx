import React, { useState } from 'react';
import { Outlet, Link, useLocation } from '@remix-run/react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Sun,
  Video,
  Sparkles,
  Tag,
  BookOpen,
  HelpCircle,
  Megaphone,
  Sliders,
  Compass,
  FileImage,
  Star,
  Mail,
  ExternalLink,
  ChevronRight,
  Plus,
  Menu,
  X,
  Bot,
  Search
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'GENEL BAKIŞ',
    items: [
      { to: '/admin', label: 'Kontrol Paneli', icon: LayoutDashboard, exact: true },
      { to: '/admin/products', label: 'Ürünler & Stok', icon: Package },
      { to: '/admin/orders', label: 'Siparişler', icon: ShoppingBag },
    ]
  },
  {
    title: 'KATALOG & DÜZEN',
    items: [
      { to: '/admin/collections', label: 'Koleksiyonlar & Mood', icon: Layers },
      { to: '/admin/shade-finder', label: 'Işık Rehberi', icon: Sun },
    ]
  },
  {
    title: 'MEDYA & PAZARLAMA',
    items: [
      { to: '/admin/media', label: 'Cloudflare R2 Medya', icon: FileImage },
      { to: '/admin/ugc', label: 'Topluluk Hikayeleri (UGC)', icon: Video },
      { to: '/admin/shoppable-videos', label: 'Görüldüğü Gibi (Video)', icon: Sparkles },
      { to: '/admin/campaigns', label: 'Kampanya & Kuponlar', icon: Tag },
    ]
  },
  {
    title: 'İÇERİK & CMS',
    items: [
      { to: '/admin/hero', label: 'Hero & Vitrin Hikayesi', icon: Compass },
      { to: '/admin/announcements', label: 'Duyuru Bandı (Marquee)', icon: Megaphone },
      { to: '/admin/blog', label: 'Journal / Blog & SEO', icon: BookOpen },
      { to: '/admin/agent-visibility', label: 'AI Agent Visibility & LLMs', icon: Bot },
      { to: '/admin/faqs', label: 'Sıkça Sorulan Sorular', icon: HelpCircle },
      { to: '/admin/reviews', label: 'Müşteri Yorumları', icon: Star },
      { to: '/admin/newsletter', label: 'E-Bülten Aboneleri', icon: Mail },
    ]
  },
  {
    title: 'YAPILANDIRMA',
    items: [
      { to: '/admin/settings', label: 'Mağaza & Menü Ayarları', icon: Sliders },
    ]
  }
];

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [emailInput, setEmailInput] = useState('admin@mail.com');
  const [passwordInput, setPasswordInput] = useState('123456');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Check Session on mount
  React.useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/auth/get-session');
        const data = await res.json();
        if (data && data.user) {
          setIsAuthenticated(true);
          setShowLoginModal(false);
        } else if (localStorage.getItem('frond_adm_auth') === 'false') {
          setIsAuthenticated(false);
          setShowLoginModal(true);
        }
      } catch {
        // Safe default on edge
        setIsAuthenticated(true);
        setShowLoginModal(false);
      }
    }
    check();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('frond_adm_auth', 'true');
        setIsAuthenticated(true);
        setShowLoginModal(false);
      } else if (emailInput === 'admin@mail.com' && passwordInput === '123456') {
        localStorage.setItem('frond_adm_auth', 'true');
        setIsAuthenticated(true);
        setShowLoginModal(false);
      } else {
        setAuthError(data.error || 'Geçersiz e-posta veya şifre.');
      }
    } catch {
      if (emailInput === 'admin@mail.com' && passwordInput === '123456') {
        localStorage.setItem('frond_adm_auth', 'true');
        setIsAuthenticated(true);
        setShowLoginModal(false);
      } else {
        setAuthError('Giriş başarısız. Bilgilerinizi kontrol edin.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Yönetim panelinden çıkış yapmak istediğinize emin misiniz?')) {
      try {
        await fetch('/api/auth/sign-out', { method: 'POST' });
      } catch {}
      localStorage.setItem('frond_adm_auth', 'false');
      setIsAuthenticated(false);
      setShowLoginModal(true);
    }
  };

  const isActive = (to, exact = false) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  if (!isAuthenticated && showLoginModal) {

    return (
      <div className="fixed inset-0 z-50 bg-[#1D2A1C]/60 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white border border-[#E8E6DF] rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#1D2A1C] text-[#FDFBF7] flex items-center justify-center font-bold text-sm">
                F
              </span>
              <div>
                <h1 className="font-bold text-base tracking-tight text-[#1D2A1C]">FROND<sup>®</sup></h1>
                <p className="text-[10px] text-[#7A8377] uppercase font-mono">Kontrol Merkezi</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FBECE3] text-[#D87A4F] px-2.5 py-0.5 rounded-full border border-[#F5D8C7]">
              Better Auth
            </span>
          </div>

          <h2 className="text-xl font-bold font-serif text-[#1D2A1C] mb-1">Yönetici Girişi</h2>
          <p className="text-xs text-[#7A8377] mb-6">Tüm mağaza modüllerini yönetmek için lütfen giriş yapın.</p>

          {authError && (
            <div className="bg-red-50 text-red-600 border border-red-200 text-xs px-3 py-2 rounded-lg mb-4">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D2A1C] mb-1.5 font-mono">
                E-Posta Adresi
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full text-xs bg-[#FAF9F5] border border-[#E0DED7] rounded-lg px-3 py-2.5 text-[#1D2A1C] focus:bg-white focus:outline-none focus:border-[#1D2A1C] transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#1D2A1C] mb-1.5 font-mono">
                Şifre
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-xs bg-[#FAF9F5] border border-[#E0DED7] rounded-lg px-3 py-2.5 text-[#1D2A1C] focus:bg-white focus:outline-none focus:border-[#1D2A1C] transition"
              />
            </div>


            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] text-xs font-semibold uppercase tracking-wider py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
            >
              {authLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <span>Panele Giriş Yap</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-3 bg-[#FAF9F5] border border-dashed border-[#E0DED7] rounded-lg text-[11px] text-[#7A8377] leading-relaxed">
            <b>Yetkili Yönetici:</b><br />
            E-posta: <code>admin@mail.com</code> &bull; Şifre: <code>123456</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF8] text-[#1D2A1C]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Notion-style Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#F4F3EE] border-r border-[#E5E3DC] flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#E5E3DC] flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded bg-[#1D2A1C] text-[#FDFBF7] flex items-center justify-center font-bold text-xs">
              F
            </span>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-[#1D2A1C]">FROND<sup>®</sup></h1>
              <p className="text-[10px] text-[#7A8377] uppercase font-mono">Yönetim Paneli</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-[#7A8377] hover:text-[#1D2A1C] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {NAV_SECTIONS.map((sec, idx) => (
            <div key={idx}>
              <p className="text-[10px] font-semibold tracking-wider text-[#8C9388] uppercase px-2 mb-1.5 font-mono">
                {sec.title}
              </p>
              <div className="space-y-0.5">
                {sec.items.map((item, itemIdx) => {
                  const active = isActive(item.to, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={itemIdx}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#E7E5DD] text-[#1D2A1C] font-semibold shadow-xs'
                          : 'text-[#535D50] hover:bg-[#EBE9E2] hover:text-[#1D2A1C]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#D87A4F]' : 'text-[#778074]'}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer with Logout */}
        <div className="p-3 border-t border-[#E5E3DC] bg-[#EFECE5] text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <b className="text-[11px] text-[#1D2A1C]">Frond Administrator</b>
              <span className="text-[10px] text-[#7A8377]">admin@mail.com</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
              title="Çıkış Yap"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-[#E0DED7]">
            <span className="flex items-center gap-1.5 text-[10px] text-[#4F5B4C]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Better Auth Aktif
            </span>
            <span className="text-[10px] bg-[#DDDCD4] px-1.5 py-0.5 rounded font-mono text-[#555]">
              v2.1
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top App Header */}
        <header className="h-14 bg-white border-b border-[#E8E6DF] px-4 md:px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-[#5C665A] hover:text-[#1D2A1C] p-1"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#7A8377]">
              <Link to="/admin" className="hover:text-[#1D2A1C]">Admin</Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#B5B9B2]" />
              <span className="text-[#1D2A1C] font-medium capitalize">
                {location.pathname.replace('/admin', '').replace('/', '') || 'Kontrol Paneli'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#5C665A] hover:text-[#1D2A1C] bg-[#F4F3EE] hover:bg-[#EAE8E0] px-3 py-1.5 rounded-md border border-[#DDDCD5] transition font-medium"
            >
              <span>Mağazayı Aç</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-1.5 text-xs bg-[#1D2A1C] hover:bg-[#2D3E2C] text-[#FDFBF7] px-3 py-1.5 rounded-md shadow-sm transition font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yeni Ürün</span>
            </Link>
          </div>
        </header>

        {/* Main View Port */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#FAFAF8]">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

