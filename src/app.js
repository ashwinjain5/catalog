
// Updated app.js with checkbox-based mobile filters
(function(){
  const state = {
    products: [],
    filters: parseFiltersFromURL(),
    shortlist: [],
  };

  const els = {
    catalogue: document.getElementById('catalogue'),
    bottomBar: document.getElementById('bottomBar'),
    selectedCount: document.getElementById('selectedCount'),
    waShareLink: document.getElementById('waShareLink'),
    shareFilterBtn: document.getElementById('shareFilterBtn'),
    exportPdfBtn: document.getElementById('exportPdfBtn'),
    searchInput: document.getElementById('searchInput'),
    filtersBtn: document.getElementById('filtersBtn'),
    filtersDialog: document.getElementById('filtersDialog'),
    chips: document.getElementById('chips'),
    filterCategory: document.getElementById('filterCategory'),
    filterSubCategory: document.getElementById('filterSubCategory'),
    filterBrand: document.getElementById('filterBrand'),
    filterColors: document.getElementById('filterColors'),
    filterPriceMin: document.getElementById('filterPriceMin'),
    filterPriceMax: document.getElementById('filterPriceMax'),
    filterInStock: document.getElementById('filterInStock'),
    clearFiltersBtn: document.getElementById('clearFiltersBtn'),
    applyFiltersBtn: document.getElementById('applyFiltersBtn'),
  };

  init();

  async function init(){
    try {
      const items = await loadProducts();
      state.products = items;
      populateDropdowns();
      bindUI();
      applyAndRender();
    } catch (e) {
      console.error(e);
      els.catalogue.innerHTML = `<div class="meta">Failed to load products. Check data source configuration.</div>`;
    }
  }

  async function loadProducts() {
    if (typeof DATA_SOURCE !== "undefined" && DATA_SOURCE === "APPS_SCRIPT" && APPS_SCRIPT_URL) {
      const payload = await jsonp(APPS_SCRIPT_URL);
      return payload.data;
    }
    return await fetchProductsFromCSV(SHEET_CSV_URL);
  }

  function uniqueNonEmpty(arr) {
    return Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }

  function collectFacetValues(products) {
    const cats = [], subs = [], brands = [], colors = [];
    for (const p of products) {
      if (p.category) cats.push(p.category);
      if (p.subCategory) subs.push(p.subCategory);
      if (p.brand) brands.push(p.brand);
      if (Array.isArray(p.colors)) colors.push(...p.colors);
    }
    return {
      categories: uniqueNonEmpty(cats),
      subCategories: uniqueNonEmpty(subs),
      brands: uniqueNonEmpty(brands),
      colors: uniqueNonEmpty(colors),
    };
  }

  function fillCheckboxList(container, options, selectedList = []) {
    const selectedSet = new Set(selectedList);
    container.innerHTML = options.map(value => {
      const checked = selectedSet.has(value) ? 'checked' : '';
      return `<label><input type="checkbox" value="${escapeHtml(value)}" ${checked}/> ${escapeHtml(value)}</label>`;
    }).join("");
  }

  function getCheckedValues(container) {
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(input => input.value);
  }

  function populateDropdowns() {
    const { categories, subCategories, brands, colors } = collectFacetValues(state.products);
    fillCheckboxList(els.filterCategory, categories, state.filters.category);
    fillCheckboxList(els.filterSubCategory, subCategories, state.filters.subCategory);
    fillCheckboxList(els.filterBrand, brands, state.filters.brand);
    fillCheckboxList(els.filterColors, colors, state.filters.colors);
  }

  function bindUI(){
    if (state.filters.search) els.searchInput.value = state.filters.search;
    if (state.filters.price_gte != null) els.filterPriceMin.value = state.filters.price_gte;
    if (state.filters.price_lte != null) els.filterPriceMax.value = state.filters.price_lte;
    if (state.filters.inStock != null) els.filterInStock.checked = !!state.filters.inStock;

    els.searchInput.addEventListener('input', (e)=>{
      state.filters.search = e.target.value || undefined;
      setFiltersToURL(state.filters);
      applyAndRender();
    });

    els.filtersBtn.addEventListener('click', ()=> els.filtersDialog.showModal());

    els.clearFiltersBtn.addEventListener('click', ()=>{
      state.filters = {};
      document.querySelectorAll('.checkbox-list input[type="checkbox"]').forEach(cb => cb.checked = false);
      els.filterPriceMin.value = "";
      els.filterPriceMax.value = "";
      els.filterInStock.checked = false;
      els.searchInput.value = "";
      setFiltersToURL(state.filters);
      applyAndRender();
    });

    els.applyFiltersBtn.addEventListener('click', ()=>{
      state.filters.category     = getCheckedValues(els.filterCategory) || undefined;
      state.filters.subCategory  = getCheckedValues(els.filterSubCategory) || undefined;
      state.filters.brand        = getCheckedValues(els.filterBrand) || undefined;
      state.filters.colors       = getCheckedValues(els.filterColors) || undefined;

      const min = els.filterPriceMin.value ? Number(els.filterPriceMin.value) : undefined;
      const max = els.filterPriceMax.value ? Number(els.filterPriceMax.value) : undefined;
      state.filters.price_gte = min;
      state.filters.price_lte = max;
      state.filters.inStock = els.filterInStock.checked ? 1 : undefined;

      setFiltersToURL(state.filters);
      applyAndRender();
    });

    els.shareFilterBtn.addEventListener('click', async ()=>{
      const url = location.href;
      try {
        if (navigator.share) await navigator.share({ url });
        else await navigator.clipboard.writeText(url);
      } catch (e){}
    });

    els.exportPdfBtn.addEventListener('click', ()=> exportVisibleAsPDF("catalogue"));
  }

  function applyAndRender(){
    renderChips();
    const filtered = applyFilters(state.products, state.filters);
    renderList(filtered);
    renderBottomBar();
  }

  function renderChips(){
    const chips = [];
    const f = state.filters;
    const pushCsv = (k, label) => { if (f[k]?.length) chips.push(`<span class="chip">${label}: ${f[k].join(",")}</span>`); };
    if (f.search) chips.push(`<span class="chip">search: ${escapeHtml(f.search)}</span>`);
    pushCsv("category", "category");
    pushCsv("subCategory", "subCategory");
    pushCsv("brand", "brand");
    pushCsv("colors", "colors");
    if (f.price_gte != null || f.price_lte != null) chips.push(`<span class="chip">price: ${f.price_gte||0}–${f.price_lte||"∞"}</span>`);
    if (f.inStock) chips.push(`<span class="chip">inStock</span>`);
    els.chips.innerHTML = chips.join("");
  }

  function renderList(list){
    if (!list.length){
      els.catalogue.innerHTML = `<div class="meta" style="text-align:center;margin-top:24px;">No products match these filters.</div>`;
      return;
    }
    els.catalogue.innerHTML = list.map(p=> cardHTML(p, isSelected(p.sku))).join("");
    els.catalogue.querySelectorAll("[data-toggle]").forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        const sku = e.currentTarget.getAttribute("data-toggle");
        toggleSelect(sku);
      });
    });
  }

  function cardHTML(p, selected){
    const img = p.imageUrl ? `<img src="${p.imageUrl}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.style.display='none'"/>` : `<div style="height:220px;background:#f3f4f6;border-radius:12px;"></div>`;
    const stockClass = p.inStock ? "in" : "out";
    const stockText = p.inStock ? "In stock" : "Out of stock";
    return `
      <article class="card">
        ${img}
        <div class="title">${escapeHtml(p.title||"Untitled")}</div>
        <div class="meta">${escapeHtml(p.sku||"")} • ${escapeHtml(p.brand||"")}</div>
        <div class="price">₹${Number(p.price||0)}</div>
        <div class="stock ${stockClass}">${stockText}</div>
        <button class="btn ${selected?'primary':''}" data-toggle="${escapeHtml(p.sku)}">${selected?'Remove from shortlist':'Add to shortlist'}</button>
      </article>
    `;
  }

  function renderBottomBar(){
    const count = state.shortlist.length;
    if (!count){ els.bottomBar.classList.add("hidden"); return; }
    els.bottomBar.classList.remove("hidden");
    els.selectedCount.textContent = `${count} selected`;
    els.waShareLink.href = buildMultiShare(state.shortlist);
  }

  function isSelected(sku){ return state.shortlist.some(i=> i.sku===sku); }
  function toggleSelect(sku){
    if (isSelected(sku)) state.shortlist = state.shortlist.filter(i=> i.sku!==sku);
    else state.shortlist = state.shortlist.concat({ sku });
    renderBottomBar();
    const btn = document.querySelector(`[data-toggle="${cssEscape(sku)}"]`);
    if (btn) btn.classList.toggle("primary");
    if (btn) btn.textContent = isSelected(sku) ? "Remove from shortlist" : "Add to shortlist";
  }

  function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, m=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function cssEscape(s){ return s.replace(/"/g, '\"'); }
})();
