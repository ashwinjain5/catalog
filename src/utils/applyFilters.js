function applyFilters(products, f){
  const s = (f.search||'').toLowerCase();
  return products.filter(p=>{
    if (f.inStock && !p.inStock) return false;
    if (f.category?.length && !f.category.includes(p.category||'')) return false;
    if (f.subCategory?.length && !f.subCategory.includes(p.subCategory||'')) return false;
    if (f.brand?.length && !f.brand.includes(p.brand||'')) return false;
    if (f.colors?.length && !(p.colors||[]).some(c=> f.colors.includes(c))) return false;
    if (f.price_gte!=null && Number(p.price)<Number(f.price_gte)) return false;
    if (f.price_lte!=null && Number(p.price)>Number(f.price_lte)) return false;
    if (s){
      const blob = (`${p.title||''} ${p.sku||''} ${(p.tags||[]).join(' ')}`).toLowerCase();
      if (!blob.includes(s)) return false;
    }
    return true;
  });
}
