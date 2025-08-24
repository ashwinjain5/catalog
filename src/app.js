(function () {
  const state = {
    products: [],
    filters: parseFiltersFromURL(),
    shortlist: [],
  };

  const els = {
    catalogue: document.getElementById("catalogue"),
    bottomBar: document.getElementById("bottomBar"),
    selectedCount: document.getElementById("selectedCount"),
    waShareLink: document.getElementById("waShareLink"),
    searchInput: document.getElementById("searchInput"),
    filtersBtn: document.getElementById("filtersBtn"),
    filtersDialog: document.getElementById("filtersDialog"),
    chips: document.getElementById("chips"),
    filterCategory: document.getElementById("filterCategory"),
    filterSubCategory: document.getElementById("filterSubCategory"),
    filterBrand: document.getElementById("filterBrand"),
    filterColors: document.getElementById("filterColors"),
    filterPriceMin: document.getElementById("filterPriceMin"),
    filterPriceMax: document.getElementById("filterPriceMax"),
    filterInStock: document.getElementById("filterInStock"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),
    applyFiltersBtn: document.getElementById("applyFiltersBtn"),
    shortlistDrawer: document.getElementById("shortlistDrawer"),
    shortlistList: document.getElementById("shortlistList"),
  };

  init();

  async function init() {
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
    if (
      typeof DATA_SOURCE !== "undefined" &&
      DATA_SOURCE === "APPS_SCRIPT" &&
      APPS_SCRIPT_URL
    ) {
      const payload = await jsonp(APPS_SCRIPT_URL);
      return payload.data;
    }
    return await fetchProductsFromCSV(SHEET_CSV_URL);
  }

  function getVisibleProducts() {
    if (state.filters.shortlistOnly?.length) {
      const shortlistSet = new Set(state.filters.shortlistOnly);
      return state.products.filter(p => shortlistSet.has(p.sku));
    }
    return applyFilters(state.products, state.filters);
  }

  function openShortlistDrawer() {
    renderShortlistList();
    shortlistDrawer.showModal();
  }

  function renderShortlistList() {
    if (!state.shortlist.length) {
      shortlistList.innerHTML = `<div>No items shortlisted yet.</div>`;
      return;
    }

    const productMap = new Map(state.products.map(p => [p.sku, p.title]));
    shortlistList.innerHTML = state.shortlist.map((item, i) => {
      const title = productMap.get(item.sku) || "Unknown Product";
      return `
        <div class="item">
          <span>${i + 1}. ${item.sku} - ${title}</span>
          <button onclick="removeFromShortlist('${item.sku}')">✖</button>
        </div>
      `;
    }).join("");
  }

  window.removeFromShortlist = function(sku) {
    state.shortlist = state.shortlist.filter(i => i.sku !== sku);
    renderShortlistList();
    renderBottomBar();
    renderList(getVisibleProducts());
  }

  window.shortlistAllVisible = function() {
    const visible = getVisibleProducts();
    const existingSkus = new Set(state.shortlist.map(i => i.sku));
    const newItems = visible
      .filter(p => !existingSkus.has(p.sku))
      .map(p => ({ sku: p.sku }));

    if (newItems.length === 0) {
      alert("All visible products are already shortlisted.");
      return;
    }

    state.shortlist = state.shortlist.concat(newItems);
    renderBottomBar();
    renderList(visible);
    alert(`${newItems.length} products added to shortlist.`);
  };


  function uniqueNonEmpty(arr) {
    return Array.from(new Set(arr.filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  function collectFacetValues(products) {
    const cats = [],
      subs = [],
      brands = [],
      colors = [];
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

  function renderCheckboxList(container, values, selectedList = []) {
    const selectedSet = new Set(selectedList);
    container.innerHTML = values
      .map((val) => {
        const checked = selectedSet.has(val) ? "checked" : "";
        return `<label><input type="checkbox" value="${escapeHtml(
          val
        )}" ${checked} /> ${escapeHtml(val)}</label>`;
      })
      .join("");
  }

  function getCheckedValues(container) {
    return Array.from(
      container.querySelectorAll("input[type=checkbox]:checked")
    ).map((i) => i.value);
  }

  function populateDropdowns() {
    const { categories, subCategories, brands, colors } = collectFacetValues(
      state.products
    );
    renderCheckboxList(
      els.filterCategory,
      categories,
      state.filters.category
    );
    renderCheckboxList(
      els.filterSubCategory,
      subCategories,
      state.filters.subCategory
    );
    renderCheckboxList(els.filterBrand, brands, state.filters.brand);
    renderCheckboxList(els.filterColors, colors, state.filters.colors);
  }

  function bindUI() {
    if (state.filters.search) els.searchInput.value = state.filters.search;
    if (state.filters.price_gte != null)
      els.filterPriceMin.value = state.filters.price_gte;
    if (state.filters.price_lte != null)
      els.filterPriceMax.value = state.filters.price_lte;
    if (state.filters.inStock != null)
      els.filterInStock.checked = !!state.filters.inStock;

    els.shareShortlistBtn = document.getElementById("shareShortlistBtn");

    els.shareShortlistBtn.addEventListener("click", () => {
      if (!state.shortlist.length) {
        alert("No products shortlisted to share.");
        return;
      }

      const skus = state.shortlist.map(i => i.sku);
      const skuParam = encodeURIComponent(skus.join(","));
      const link = `${location.origin}${location.pathname}?shortlistOnly=${skuParam}`;

      const productMap = new Map(state.products.map(p => [p.sku, p.title]));
      const items = skus.map((sku, idx) => {
        const title = productMap.get(sku) || "Unknown Product";
        return `${idx + 1}. ${sku} - ${title}`;
      });

      const message =
        `Hi! Here's a selection from Dhariwal Bags:\n\n` +
        items.join("\n") +
        `\n\nView here: ${link}`;

      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(waUrl, "_blank");
    });

    els.searchInput.addEventListener("input", (e) => {
      state.filters.search = e.target.value || undefined;
      setFiltersToURL(state.filters);
      applyAndRender();
    });

    els.filtersBtn.addEventListener("click", () =>
      els.filtersDialog.showModal()
    );

    els.clearFiltersBtn.addEventListener("click", () => {
      state.filters = {};
      ["filterCategory", "filterSubCategory", "filterBrand", "filterColors"].forEach(
        (id) => {
          els[id]
            .querySelectorAll("input[type=checkbox]")
            .forEach((cb) => (cb.checked = false));
        }
      );
      els.filterPriceMin.value = "";
      els.filterPriceMax.value = "";
      els.filterInStock.checked = false;
      els.searchInput.value = "";
      setFiltersToURL(state.filters);
      applyAndRender();
    });

    els.applyFiltersBtn.addEventListener("click", () => {
      state.filters.category =
        getCheckedValues(els.filterCategory) || undefined;
      state.filters.subCategory =
        getCheckedValues(els.filterSubCategory) || undefined;
      state.filters.brand = getCheckedValues(els.filterBrand) || undefined;
      state.filters.colors = getCheckedValues(els.filterColors) || undefined;
      const min = els.filterPriceMin.value
        ? Number(els.filterPriceMin.value)
        : undefined;
      const max = els.filterPriceMax.value
        ? Number(els.filterPriceMax.value)
        : undefined;
      state.filters.price_gte = min;
      state.filters.price_lte = max;
      state.filters.inStock = els.filterInStock.checked ? 1 : undefined;
      setFiltersToURL(state.filters);
      applyAndRender();
    });

  }

  function applyAndRender() {
    renderChips();
    const visible = getVisibleProducts();
    renderList(visible);
    renderBottomBar();
  }

  function renderChips() {
    const chips = [];
    const f = state.filters;
    const pushCsv = (k, label) => {
      if (f[k]?.length)
        chips.push(
          `<span class="chip">${label}: ${f[k].join(",")}</span>`
        );
    };
    if (f.search)
      chips.push(`<span class="chip">search: ${escapeHtml(f.search)}</span>`);
    pushCsv("category", "category");
    pushCsv("subCategory", "subCategory");
    pushCsv("brand", "brand");
    pushCsv("colors", "colors");
    if (f.price_gte != null || f.price_lte != null)
      chips.push(
        `<span class="chip">price: ${f.price_gte || 0}–${
          f.price_lte || "∞"
        }</span>`
      );
    if (f.inStock) chips.push(`<span class="chip">inStock</span>`);
    if (f.shortlistOnly?.length)
    chips.push(`<span class="chip">Shortlist only: ${f.shortlistOnly.length} items</span>`);

    els.chips.innerHTML = chips.join("");

  }

  function renderList(list) {
    if (!list.length) {
      els.catalogue.innerHTML = `<div class="meta" style="text-align:center;margin-top:24px;">No products match these filters.</div>`;
      return;
    }

    const shortlistAllBtnHTML = `
      <div style="margin: 12px 0; text-align: right;">
        <button class="btn" onclick="shortlistAllVisible()">Shortlist All</button>
      </div>
    `;

    const productCardsHTML = list
      .map((p) => cardHTML(p, isSelected(p.sku)))
      .join("");

    els.catalogue.innerHTML = shortlistAllBtnHTML + productCardsHTML;

    els.catalogue.querySelectorAll("[data-toggle]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const sku = e.currentTarget.getAttribute("data-toggle");
        toggleSelect(sku);
      });
    });
  }

  function cardHTML(p, selected) {
    const img = p.imageUrl
      ? `<img src="${p.imageUrl}" alt="${escapeHtml(
          p.title
        )}" loading="lazy" onerror="this.style.display='none'"/>`
      : `<div style="height:220px;background:#f3f4f6;border-radius:12px;"></div>`;
    const stockClass = p.inStock ? "in" : "out";
    const stockText = p.inStock ? "In stock" : "Out of stock";
    return `
      <article class="card">
        ${img}
        <div class="title">${escapeHtml(p.title || "Untitled")}</div>
        <div class="meta">${escapeHtml(p.sku || "")} • ${escapeHtml(
      p.brand || ""
    )}</div>
        <div class="price">₹${Number(p.price || 0)}</div>
        <div class="stock ${stockClass}">${stockText}</div>
        <button class="btn ${selected ? "primary" : ""}" data-toggle="${escapeHtml(
      p.sku
    )}">${selected ? "Remove from shortlist" : "Add to shortlist"}</button>
      </article>
    `;
  }

  function renderBottomBar(){
    els.bottomBar.classList.remove("hidden");
    const count = state.shortlist.length;
    els.selectedCount.textContent = `${count} selected`;
    els.waShareLink.href = buildMultiShare(state.shortlist);
  }

  function isSelected(sku) {
    return state.shortlist.some((i) => i.sku === sku);
  }

  function toggleSelect(sku) {
    if (isSelected(sku))
      state.shortlist = state.shortlist.filter((i) => i.sku !== sku);
    else state.shortlist = state.shortlist.concat({ sku });
    renderBottomBar();
    const btn = document.querySelector(`[data-toggle="${cssEscape(sku)}"]`);
    if (btn) btn.classList.toggle("primary");
    if (btn)
      btn.textContent = isSelected(sku)
        ? "Remove from shortlist"
        : "Add to shortlist";
  }

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (m) => {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m];
    });
  }

  function cssEscape(s) {
    return s.replace(/"/g, '\\"');
  }

  window.openShortlistDrawer = openShortlistDrawer;
  window.shortlistAllVisible = shortlistAllVisible;
})();
