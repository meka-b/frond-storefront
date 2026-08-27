/* ============================================================
   FROND  Blog & Magazine Controller (Magazine Showcase + Grid)
   Handles Category Filters, Magazine Layout, Dynamic Data
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.loadCatalogData === 'function') {
    await window.loadCatalogData();
  }

  const featuredCol = document.getElementById('mag-featured-card');
  const stackedCol = document.getElementById('mag-stacked-list');
  const allGrid = document.getElementById('blog-all-grid');
  const catNav = document.getElementById('blog-cat-nav');

  let activeTag = 'all';

  function getBlogs() {
    return window.BLOGS || [];
  }

  function getFilteredBlogs() {
    const list = getBlogs();
    if (activeTag === 'all') return list;
    return list.filter(b => b.tag && b.tag.toLowerCase() === activeTag.toLowerCase());
  }

  // 1. Render Top Popular Showcase (Magazine Grid: Left Hero + Right Stacked Rows)
  function renderMagazineShowcase() {
    const blogs = getBlogs();
    if (!featuredCol || !stackedCol || blogs.length === 0) return;

    const featured = blogs.find(b => b.is_featured) || blogs[0];
    const populars = blogs.filter(b => b.id !== featured.id).slice(0, 4);

    // Left Big Hero Card (Inspired by the user reference image)
    featuredCol.innerHTML = `
      <a class="mag-hero-card" href="/blogs/${featured.id}" data-reveal>
        <div class="mag-hero-img-wrap">
          <img src="${featured.cover_image || '/assets/img/hero.jpg'}" alt="${featured.title}" loading="lazy" decoding="async">
        </div>
        <div class="mag-hero-overlay">
          <span class="mag-tag-badge">${featured.tag || 'Editorial'}</span>
          <h3 class="mag-hero-title">${featured.title}</h3>
          <div class="mag-author-strip">
            <div class="mag-avatar">${(featured.author_name || 'Maya Lin').split(' ').map(n => n[0]).join('')}</div>
            <span class="mag-author-name">${featured.author_name || 'Maya Lin'}</span>
            <span class="mag-sep"></span>
            <span class="mag-date">${featured.read_time || '6 min read'}</span>
          </div>
        </div>
      </a>
    `;

    // Right Compact Stacked Rows with Thumbnails
    stackedCol.innerHTML = populars.map(b => `
      <a class="mag-stacked-row" href="/blogs/${b.id}" data-reveal>
        <div class="mag-row-info">
          <div class="mag-row-author">
            <div class="mag-mini-avatar">${(b.author_name || 'Ava').split(' ').map(n => n[0]).join('')}</div>
            <span class="mag-author-txt">${b.author_name || 'Ava Thompson'}</span>
            <span class="mag-views">✦ 350+ reads</span>
          </div>
          <h4 class="mag-row-title">${b.title}</h4>
        </div>
        <div class="mag-row-thumb">
          <img src="${b.cover_image || '/assets/img/ch-big-1.jpg'}" alt="${b.title}" loading="lazy" decoding="async">
        </div>
      </a>
    `).join('');

    if (typeof initReveals === 'function') {
      initReveals(document.getElementById('magazine-grid'));
    }
  }

  // 2. Render All / Latest Articles Grid (3-column standard cards)
  function renderAllGrid() {
    if (!allGrid) return;
    const items = getFilteredBlogs();

    if (items.length === 0) {
      allGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--ink-60);">No articles found in this category.</p>`;
      return;
    }

    allGrid.innerHTML = items.map((b, idx) => `
      <article class="blog-card" data-reveal style="--d:${(idx % 3) * 100}ms">
        <a class="blog-card-media" href="/blogs/${b.id}" aria-label="${b.title}">
          <span class="blog-card-tag">${b.tag || 'Care'}</span>
          <img src="${b.cover_image || '/assets/img/hero.jpg'}" alt="${b.title}" loading="lazy" decoding="async">
        </a>
        <div class="blog-card-body">
          <div class="blog-card-meta">
            <span>${b.read_time || '5 min read'}</span>
            <span></span>
            <span>${b.author_name || 'Greenhouse Team'}</span>
          </div>
          <h3 class="blog-card-title">
            <a href="/blogs/${b.id}">${b.title}</a>
          </h3>
          <p class="blog-card-excerpt">${b.excerpt || ''}</p>
          <a class="blog-card-link" href="/blogs/${b.id}">Read full story <span class="arr"></span></a>
        </div>
      </article>
    `).join('');

    if (typeof initReveals === 'function') {
      initReveals(allGrid);
    }
  }

  // Category Tag Buttons
  if (catNav) {
    catNav.querySelectorAll('.blog-cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        catNav.querySelectorAll('.blog-cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTag = btn.dataset.tag;
        renderAllGrid();
      });
    });
  }

  document.addEventListener('catalog:live', () => {
    renderMagazineShowcase();
    renderAllGrid();
  });

  renderMagazineShowcase();
  renderAllGrid();
});
