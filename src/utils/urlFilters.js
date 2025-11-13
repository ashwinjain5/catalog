function parseFiltersFromURL() {
  const params = new URLSearchParams(location.search);
  const filters = {};

  for (const [key, value] of params.entries()) {
    if (["category", "subCategory", "brand", "colors"].includes(key)) {
      filters[key] = value.split(",");
    } else if (["price_gte", "price_lte"].includes(key)) {
      filters[key] = Number(value);
    } else if (key === "inStock") {
      filters[key] = value === "1" ? 1 : undefined;
    } else if (key === "search") {
      filters[key] = value;
    } else if (key === "shortlistOnly") {
      // legacy param without quantities
      filters.shortlistOnly = value.split(",");
    } else if (key === "shortlist") {
      // expected format: SKU:qty,SKU2:qty2
      filters.shortlist = value.split(",").map(pair => {
        const [sku, qty] = pair.split(":");
        return { sku, qty: Number(qty || 1) };
      });
    }
  }

  return filters;
}

function setFiltersToURL(f){
  const p = new URLSearchParams();
  const setArr = (k, v)=> v&&v.length && p.set(k, v.join(','));
  if (f.search) p.set('search', f.search);
  if (f.inStock!==undefined) p.set('inStock', f.inStock ? '1':'0');
  if (f.price_gte!==undefined) p.set('price_gte', String(f.price_gte));
  if (f.price_lte!==undefined) p.set('price_lte', String(f.price_lte));
  setArr('category', f.category);
  setArr('subCategory', f.subCategory);
  setArr('brand', f.brand);
  setArr('colors', f.colors);
  // optional: include shortlist (sku:qty) when present on filters object
  if (f.shortlist && f.shortlist.length) {
    const encoded = f.shortlist.map(i => `${i.sku}:${i.qty||1}`).join(',');
    p.set('shortlist', encoded);
  }
  history.replaceState(null,'',`?${p.toString()}`);
}
