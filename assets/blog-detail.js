/* ============================================================
   FROND  Article Detail & Editorial Floating TOC ScrollSpy
   - Generates Dynamic TOC from H2 and H3 tags
   - Smooth Scroll & IntersectionObserver ScrollSpy (Active Vertical Bar)
   - Modern Mobile TOC Floating Pill & Bottom Sheet
   - Dynamic Related Articles
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof window.loadCatalogData === 'function') {
    await window.loadCatalogData();
  }

  // Get article ID from URL (/blogs/:id)
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const articleId = pathParts[1] || 'propagate-in-water';

  const blogs = window.BLOGS || [];
  const article = blogs.find(b => b.id === articleId) || blogs[0];

  if (!article) return;

  // DOM Elements
  const titleEl = document.getElementById('art-title');
  const tagBadge = document.getElementById('art-tag-badge');
  const authorAvatar = document.getElementById('art-author-avatar');
  const authorName = document.getElementById('art-author-name');
  const authorRole = document.getElementById('art-author-role');
  const readTimeEl = document.getElementById('art-read-time');
  const coverImg = document.getElementById('art-cover-img');
  const contentBody = document.getElementById('art-content-body');
  const tocNavList = document.getElementById('toc-nav-list');
  const relatedGrid = document.getElementById('art-related-grid');

  // Mobile Sheet Elements
  const mobileFab = document.getElementById('mobile-toc-fab');
  const mobileSheet = document.getElementById('mobile-toc-sheet');
  const mobileBackdrop = document.getElementById('mobile-toc-backdrop');
  const mobileCloseBtn = document.getElementById('btn-close-sheet');
  const mobileSheetList = document.getElementById('mobile-toc-sheet-list');

  // Populate Header & Cover
  if (titleEl) titleEl.textContent = article.title;
  if (tagBadge) tagBadge.textContent = article.tag || 'Care Lab';
  if (authorName) authorName.textContent = article.author_name || 'Maya Lin';
  if (authorRole) authorRole.textContent = article.author_role || 'Botanical Specialist';
  if (authorAvatar) {
    authorAvatar.textContent = (article.author_name || 'ML').split(' ').map(n => n[0]).join('');
  }
  if (readTimeEl) readTimeEl.textContent = article.read_time || '6 min read';
  if (coverImg) {
    coverImg.src = article.cover_image || '/assets/img/hero.jpg';
    coverImg.alt = article.title;
  }

  // Populate Content
  if (contentBody) {
    contentBody.innerHTML = article.content || '<p>Content arriving soon from the greenhouse...</p>';
  }

  // 1. Build Editorial Floating Table of Contents (TOC) from H2/H3
  function initTOC() {
    if (!contentBody || !tocNavList) return;

    const headings = contentBody.querySelectorAll('h2, h3');
    if (headings.length === 0) {
      const aside = document.querySelector('.art-toc-col');
      if (aside) aside.style.display = 'none';
      if (mobileFab) mobileFab.style.display = 'none';
      return;
    }

    let tocHtml = '';
    let mobileTocHtml = '';

    headings.forEach((h, i) => {
      if (!h.id) {
        h.id = 'sec-' + (i + 1);
      }
      const isSub = h.tagName.toLowerCase() === 'h3';
      const cleanTitle = h.textContent.replace(/^\d+[\.\)]\s*/, '');

      tocHtml += `
        <a href="#${h.id}" class="toc-item ${isSub ? 'toc-sub' : ''}" data-target="${h.id}">
          <span class="toc-bar"></span>
          <span class="toc-text">${cleanTitle}</span>
        </a>
      `;

      mobileTocHtml += `
        <a href="#${h.id}" class="mobile-toc-item ${isSub ? 'sub' : ''}" data-target="${h.id}">
          <span class="dot"></span>
          <span>${cleanTitle}</span>
        </a>
      `;
    });

    tocNavList.innerHTML = tocHtml;
    if (mobileSheetList) mobileSheetList.innerHTML = mobileTocHtml;

    // Smooth Scroll Click Binding
    const bindScroll = (container, isMobile = false) => {
      if (!container) return;
      container.querySelectorAll('a[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.dataset.target;
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            const offsetTop = targetEl.getBoundingClientRect().top + window.pageYOffset - 90;
            window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            history.pushState(null, null, '#' + targetId);
          }
          if (isMobile) {
            closeMobileSheet();
          }
        });
      });
    };

    bindScroll(tocNavList, false);
    bindScroll(mobileSheetList, true);

    // 2. IntersectionObserver for ScrollSpy
    const tocLinks = tocNavList.querySelectorAll('.toc-item');
    const mobileLinks = mobileSheetList ? mobileSheetList.querySelectorAll('.mobile-toc-item') : [];
    let activeId = null;

    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -65% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          activeId = entry.target.id;
          highlightTOC(activeId);
        }
      });
    }, observerOptions);

    headings.forEach(h => observer.observe(h));

    function highlightTOC(id) {
      tocLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === id);
      });
      mobileLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === id);
      });
    }

    if (headings[0]) {
      highlightTOC(headings[0].id);
    }
  }

  // 3. Modern Mobile Floating Action Button (FAB) & Drawer Sheet
  function openMobileSheet() {
    if (mobileSheet && mobileBackdrop) {
      mobileSheet.classList.add('open');
      mobileBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileSheet() {
    if (mobileSheet && mobileBackdrop) {
      mobileSheet.classList.remove('open');
      mobileBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (mobileFab) mobileFab.addEventListener('click', openMobileSheet);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobileSheet);
  if (mobileBackdrop) mobileBackdrop.addEventListener('click', closeMobileSheet);

  // 4. Render Related Articles
  function renderRelated() {
    if (!relatedGrid) return;
    const others = blogs.filter(b => b.id !== article.id).slice(0, 3);
    relatedGrid.innerHTML = others.map(b => `
      <article class="blog-card" data-reveal>
        <a class="blog-card-media" href="/blogs/${b.id}" aria-label="${b.title}">
          <span class="blog-card-tag">${b.tag || 'Care'}</span>
          <img src="${b.cover_image || '/assets/img/hero.jpg'}" alt="${b.title}" loading="lazy">
        </a>
        <div class="blog-card-body">
          <div class="blog-card-meta">
            <span>${b.read_time || '5 min read'}</span>
            <span></span>
            <span>${b.author_name || 'Greenhouse Team'}</span>
          </div>
          <h3 class="blog-card-title"><a href="/blogs/${b.id}">${b.title}</a></h3>
          <p class="blog-card-excerpt">${b.excerpt || ''}</p>
        </div>
      </article>
    `).join('');

    if (typeof initReveals === 'function') {
      initReveals(relatedGrid);
    }
  }

  initTOC();
  renderRelated();
});
