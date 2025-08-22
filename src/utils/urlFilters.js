function parseFiltersFromURL(){
  const p = new URLSearchParams(location.search);
  const arr = k => (p.get(k)? p.get(k).split(',').filter(Boolean): undefined);
  const num = k => (p.get(k)? Number(p.get(k)): undefined);
  const bool = k => (p.get(k)? p.get(k)==='1' : undefined);
  return {
    category: arr('category'),
    subCategory: arr('subCategory'),
    brand: arr('brand'),
    colors: arr('colors'),
    price_gte: num('price_gte'),
    price_lte: num('price_lte'),
    inStock: bool('inStock'),
    search: p.get('search') || undefined,
  };
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
