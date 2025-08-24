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
    } else if (key === "shortlistOnly" || key === "shortlist") {
      filters.shortlistOnly = value.split(",");
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
  history.replaceState(null,'',`?${p.toString()}`);
}
