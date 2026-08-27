/* ============================================================
   FROND  Collections & Category Storefront Controller
   - Horizontal Single-Row Embla Carousel for Category Cards
   - Multi-Select Toggle Switch Filters (In Stock, Light, Pet, etc.)
   - Luxury Custom Floating Sort Dropdown Menu
   - Standard <product-card> components
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for catalog data from API
  if (typeof window.loadCatalogData === 'function') {
    await window.loadCatalogData();
  }

  // DOM Elements
  const emblaVp = document.getElementById('col-embla-viewport');
  const emblaTrack = document.getElementById('col-embla-track');

  const productGrid = document.getElementById('col-product-grid');
  const emptyBox = document.getElementById('col-empty');
  const resultsCountEl = document.getElementById('col-results-count');
  const colTitle = document.getElementById('col-title');
  const colDesc = document.getElementById('col-desc');
  const moodSec = document.getElementById('mood-sec');
  const moodGrid = document.getElementById('mood-tiles-grid');
  const btnResetEmpty = document.getElementById('btn-reset-filters');
  const btnClearAll = document.getElementById('btn-clear-all');

  // Multi-Select Switches
  const switchesWrap = document.getElementById('col-filter-switches');
  const filterEmblaVp = document.getElementById('filter-embla-vp');

  // Custom Sort Dropdown Elements
  const sortTriggerBtn = document.getElementById('sort-trigger-btn');
  const sortDropdownMenu = document.getElementById('sort-dropdown-menu');
  const sortSelectedLabel = document.getElementById('sort-selected-label');

  // Detect active collection from URL path (/collections/:handle) or query (?handle=...)
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let activeCollectionId = 'all';
  if (pathParts.length >= 2 && pathParts[0] === 'collections') {
    activeCollectionId = pathParts[1];
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    activeCollectionId = urlParams.get('handle') || 'all';
  }

  // Set of Active Multi-Select Filters
  const activeFilters = new Set();
  let activeSort = 'featured';

  function getCollections() {
    return window.COLLECTIONS || [];
  }

  function getProducts() {
    return window.PRODUCTS || [];
  }

  function getMoodTiles() {
    return window.MOOD_TILES || [];
  }

  // 1. Render Horizontal Category Carousel Cards (No border, No shadow)
  function renderCategoryCarousel() {
    if (!emblaTrack) return;
    const collections = getCollections();
    const products = getProducts();

    let html = `
      <a class="col-cat-card ${activeCollectionId === 'all' ? 'active' : ''}" href="/collections" data-col-id="all">
        <img src="/assets/img/hero.jpg" alt="All Plants" loading="lazy" decoding="async">
        <div class="col-cat-info">
          <div>
            <div class="col-cat-title">All Plants &amp; Objects</div>
            <div class="col-cat-count">${products.length} Varieties</div>
          </div>
          <span class="col-cat-go" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12 12 4M6 4h6v6"/></svg>
          </span>
        </div>
      </a>
    `;

    collections.forEach(col => {
      let count = 0;
      if (Array.isArray(col.products) && col.products.length > 0) {
        count = col.products.length;
      } else {
        const colKey = col.id.replace(/-/g, ' ').toLowerCase();
        count = products.filter(p => {
          const text = (p.title + ' ' + (p.tags || '') + ' ' + p.id).toLowerCase();
          return text.includes(col.id) || text.includes(colKey);
        }).length;
      }

      const img = col.image_url || '/assets/img/ch-big-1.jpg';
      const isActive = col.id === activeCollectionId;

      html += `
        <a class="col-cat-card ${isActive ? 'active' : ''}" href="/collections/${col.id}" data-col-id="${col.id}">
          <img src="${img}" alt="${col.title}" loading="lazy" decoding="async">
          <div class="col-cat-info">
            <div>
              <div class="col-cat-title">${col.title}</div>
              <div class="col-cat-count">${count} Varieties</div>
            </div>
            <span class="col-cat-go" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12 12 4M6 4h6v6"/></svg>
            </span>
          </div>
        </a>
      `;
    });

    emblaTrack.innerHTML = html;

    // Attach click events
    emblaTrack.querySelectorAll('.col-cat-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        const id = card.dataset.colId;
        setCollection(id);
      });
    });

    initCategoryEmbla();
  }

  // 2. Category Carousel Embla Engine
  let catEmblaInstance = null;
  function initCategoryEmbla() {
    if (!emblaVp) return;
    const Embla = window.EmblaCarousel || window.emblaCarousel;
    if (!Embla) return;

    if (catEmblaInstance) {
      catEmblaInstance.destroy();
    }

    try {
      catEmblaInstance = Embla(emblaVp, {
        dragFree: true,
        containScroll: 'trimSnaps',
        align: 'start'
      });
    } catch (e) {}
  }

  // 3. Set Active Collection & Update Header Info
  function setCollection(colId) {
    activeCollectionId = colId;
    const collections = getCollections();

    // Update URL without full reload
    const newUrl = colId === 'all' ? '/collections' : `/collections/${colId}`;
    window.history.pushState({ colId }, '', newUrl);

    // Update Active Card Class
    if (emblaTrack) {
      emblaTrack.querySelectorAll('.col-cat-card').forEach(card => {
        card.classList.toggle('active', card.dataset.colId === colId);
      });
    }

    // Update Header Text
    if (colId === 'all') {
      if (colTitle) colTitle.innerHTML = `<reveal-text>The Botanical</reveal-text> <span class="ch-mark">Catalog<svg viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true"><path d="M2 9 C 30 3, 70 3, 98 7"/></svg></span>`;
      if (colDesc) colDesc.textContent = `Slow-grown varieties nurtured in greenhouse soil. Shipped with roots happy and a 7-day guarantee.`;
    } else {
      const col = collections.find(c => c.id === colId);
      if (col) {
        if (colTitle) colTitle.innerHTML = `<reveal-text>${col.title}</reveal-text>`;
        if (colDesc) colDesc.textContent = col.description || `Curated greenhouse selection of ${col.title.toLowerCase()}.`;
      }
    }

    renderProducts();
  }

  // 4. Multi-Criteria Filter & Sort Products
  function getFilteredProducts() {
    const products = getProducts();
    const collections = getCollections();
    let list = [...products];

    // A. Filter by Category / Collection
    if (activeCollectionId !== 'all') {
      const col = collections.find(c => c.id === activeCollectionId);
      if (col && Array.isArray(col.products) && col.products.length > 0) {
        list = list.filter(p => col.products.includes(p.id));
      } else {
        const colKey = activeCollectionId.replace(/-/g, ' ').toLowerCase();
        list = list.filter(p => {
          const text = (p.title + ' ' + (p.tags || '') + ' ' + p.id).toLowerCase();
          if (activeCollectionId.includes('cacti') || activeCollectionId.includes('succulent')) {
            return text.includes('kakt') || text.includes('cact') || text.includes('succulent') || text.includes('lophocereus') || text.includes('eulychnia');
          }
          if (activeCollectionId.includes('pot') || activeCollectionId.includes('object')) {
            return text.includes('pot') || text.includes('planter') || text.includes('ceramic');
          }
          return text.includes(activeCollectionId) || text.includes(colKey);
        });
      }
    }

    // B. Multi-Select Toggle Switch Filters (Intersection AND logic)
    if (activeFilters.has('stock:in')) {
      list = list.filter(p => {
        if (Array.isArray(p.variants) && p.variants.length > 0) {
          return p.variants.some(v => v.available !== false && (v.stock === undefined || v.stock > 0));
        }
        return true;
      });
    }

    if (activeFilters.has('light:bright')) {
      list = list.filter(p => p.care && p.care.light && p.care.light.toLowerCase().includes('bright'));
    }

    if (activeFilters.has('light:low')) {
      list = list.filter(p => p.care && p.care.light && (p.care.light.toLowerCase().includes('medium') || p.care.light.toLowerCase().includes('low') || p.care.light.toLowerCase().includes('tolerates')));
    }

    if (activeFilters.has('pet:friendly')) {
      list = list.filter(p => p.care && p.care.pet && p.care.pet.toLowerCase().includes('friendly'));
    }

    if (activeFilters.has('tag:easy')) {
      list = list.filter(p => (p.tags && p.tags.toLowerCase().includes('easy')) || (p.care && p.care.water && p.care.water.toLowerCase().includes('14')));
    }

    if (activeFilters.has('bestseller')) {
      list = list.filter(p => p.bestseller || (p.badge && p.badge.toLowerCase().includes('bestseller')));
    }

    // C. Sort
    if (activeSort === 'price-asc') {
      list.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
    } else if (activeSort === 'price-desc') {
      list.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
    } else if (activeSort === 'title-asc') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }

  // 5. Render Product Grid
  function renderProducts() {
    if (!productGrid) return;
    const items = getFilteredProducts();

    if (resultsCountEl) {
      resultsCountEl.innerHTML = `<span class="count-num">${items.length}</span> ${items.length === 1 ? 'plant' : 'plants'}`;
    }

    // Show/Hide Clear All button
    if (btnClearAll) {
      btnClearAll.style.display = activeFilters.size > 0 ? 'inline-block' : 'none';
    }

    if (items.length === 0) {
      productGrid.innerHTML = '';
      if (emptyBox) emptyBox.style.display = 'block';
      return;
    }

    if (emptyBox) emptyBox.style.display = 'none';

    productGrid.innerHTML = items.map((p, idx) => `
      <product-card product="${p.id}" data-reveal style="--d:${(idx % 4) * 80}ms"></product-card>
    `).join('');

    // Re-init reveals on new elements
    if (typeof initReveals === 'function') {
      initReveals();
    }
  }

  // 6. Render Mood Tiles (Curated atmospheres)
  function renderMoodTiles() {
    if (!moodSec || !moodGrid) return;
    const moodTiles = getMoodTiles();
    if (!moodTiles || moodTiles.length === 0) {
      moodSec.style.display = 'none';
      return;
    }

    moodSec.style.display = 'block';
    moodGrid.innerHTML = moodTiles.map(mt => `
      <a class="tile" href="${mt.link_url || '/collections'}" data-reveal>
        <img src="${mt.image_url}" alt="${mt.title}" loading="lazy" decoding="async">
        <div class="tile-label">
          <h3 class="serif" style="font-size:1.4rem;font-weight:400;letter-spacing:0">${mt.title}</h3>
          <span class="tile-go" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12 12 4M6 4h6v6"/></svg>
          </span>
        </div>
      </a>
    `).join('');

    if (typeof initReveals === 'function') {
      initReveals(moodSec);
    }
  }

  // 7. Mobile Embla for Switch Strip
  function initFilterEmbla() {
    if (!filterEmblaVp) return;
    const Embla = window.EmblaCarousel || window.emblaCarousel;
    if (!Embla) return;

    let emblaInstance = null;
    const checkViewport = () => {
      if (window.innerWidth <= 900) {
        if (!emblaInstance) {
          try {
            emblaInstance = Embla(filterEmblaVp, {
              dragFree: true,
              containScroll: 'trimSnaps',
              align: 'start'
            });
          } catch (e) {}
        }
      } else {
        if (emblaInstance) {
          emblaInstance.destroy();
          emblaInstance = null;
        }
      }
    };

    checkViewport();
    window.addEventListener('resize', () => {
      clearTimeout(window._emblaResizeTimer);
      window._emblaResizeTimer = setTimeout(checkViewport, 150);
    });
  }

  // 8. Event Listeners for Multi-Select Toggle Switches
  if (switchesWrap) {
    switchesWrap.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', () => {
        const filterKey = input.dataset.filter;
        if (input.checked) {
          activeFilters.add(filterKey);
        } else {
          activeFilters.delete(filterKey);
        }
        renderProducts();
      });
    });
  }

  // Clear all filters action
  const resetAllSwitches = () => {
    activeFilters.clear();
    if (switchesWrap) {
      switchesWrap.querySelectorAll('input[type="checkbox"]').forEach(i => i.checked = false);
    }
    renderProducts();
  };

  if (btnClearAll) btnClearAll.addEventListener('click', resetAllSwitches);
  if (btnResetEmpty) btnResetEmpty.addEventListener('click', resetAllSwitches);

  // 9. Custom Luxury Sort Dropdown Logic
  if (sortTriggerBtn && sortDropdownMenu) {
    // Toggle dropdown open/close
    sortTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = sortDropdownMenu.classList.contains('open');
      sortDropdownMenu.classList.toggle('open', !isOpen);
      sortTriggerBtn.setAttribute('aria-expanded', !isOpen);
    });

    // Option selection
    sortDropdownMenu.querySelectorAll('.sort-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        const val = opt.dataset.value;
        const text = opt.querySelector('span')?.textContent || val;
        activeSort = val;

        if (sortSelectedLabel) {
          sortSelectedLabel.textContent = text.replace('Price: ', '').replace('Alphabetical: ', '');
        }

        sortDropdownMenu.querySelectorAll('.sort-opt').forEach(o => {
          const isSelected = o.dataset.value === val;
          o.classList.toggle('active', isSelected);
          o.setAttribute('aria-selected', isSelected);
        });

        sortDropdownMenu.classList.remove('open');
        sortTriggerBtn.setAttribute('aria-expanded', 'false');
        renderProducts();
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!sortTriggerBtn.contains(e.target) && !sortDropdownMenu.contains(e.target)) {
        sortDropdownMenu.classList.remove('open');
        sortTriggerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Listen to live catalog updates if refreshed
  document.addEventListener('catalog:live', () => {
    renderCategoryCarousel();
    setCollection(activeCollectionId);
    renderMoodTiles();
  });

  // Initial Render
  renderCategoryCarousel();
  setCollection(activeCollectionId);
  renderMoodTiles();
  initFilterEmbla();
});
