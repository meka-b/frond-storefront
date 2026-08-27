# FROND — Statik Tema Klonu (demo)

## Çalıştırma
Proje tamamen statik (HTML + CSS + JS). Herhangi bir derleme adımı yoktur.

Yerel sunucuyla açın (önerilir):
```
cd frond-clone
python3 -m http.server 8000
```
Tarayıcıda: http://localhost:8000/  (anasayfa)
Ürün sayfası örnek: http://localhost:8000/product.html?handle=monstera

## Dosya yapısı
- index.html          → Anasayfa (hero kolajı, bestsellers, UGC, As Seen In, vb.)
- product.html        → Ürün detay sayfası (PDP, ?handle= parametresiyle)
- assets/theme.css    → Tüm stiller
- assets/theme.js     → Web Components (product-card, drawer's, carousel'ler, sepet)
- assets/product.js   → PDP kontrolcüsü (galeri, varyant, sticky modüller)
- assets/data.js      → Ürün verisi + yardımcılar
- assets/vendor/      → Embla Carousel (yatay/dikey kaydırmalar)
- assets/img/         → Yerel görseller

## Notlar
- Sepet localStorage'da tutulur (frond_cart_v1).
- CDN üzerinden yüklenen bazı video/görseller internet bağlantısı gerektirir.
- Tarayıcıda eski sürüm görünürse Ctrl+Shift+R ile sert yenileyin.
