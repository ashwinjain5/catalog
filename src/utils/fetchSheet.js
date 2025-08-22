async function fetchProductsFromCSV(csvUrl){
  if (!csvUrl || csvUrl.includes("REPLACE")) throw new Error("SHEET_CSV_URL not configured in config.js");
  const res = await fetch(csvUrl, { cache: "no-store" });
  const text = await res.text();
  const lines = text.replace(/\r/g,'').trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(l => l.split(','));
  const products = rows.filter(r => r.join('').trim().length).map(cols => {
    const row = {}; headers.forEach((h,i)=> row[h] = (cols[i]??'').trim());
    return shapeRow(row);
  });
  return products;
}
function shapeRow(row){
  return {
    sNo: Number(row.sNo||0),
    sku: row.sku,
    title: row.title,
    category: row.category,
    subCategory: row.subCategory,
    brand: row.brand,
    price: Number(row.price||0),
    mrp: Number(row.mrp||0),
    inStock: /^(1|true|yes)$/i.test(row.inStock||''),
    imageUrl: row.imageUrl,
    colors: (row.colorOptions||'').split(',').map(s=>s.trim()).filter(Boolean),
    tags: (row.tags||'').split(',').map(s=>s.trim()).filter(Boolean),
    priority: Number(row.priority||0),
    notes: row.notes||''
  };
}
