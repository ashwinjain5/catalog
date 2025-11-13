function buildMultiShare(selected){
  const lines = selected.map(i => `• ${i.sku}${(i.qty||0)?` x ${i.qty||1}`:''}${i.color?` (${i.color})`:''}${i.note?` — ${i.note}`:''}`);
  // Build a view URL encoding shortlist with quantities
  const pairs = selected.map(i => `${i.sku}:${i.qty||1}`).join(',');
  const url = `${location.origin}${location.pathname}?shortlist=${encodeURIComponent(pairs)}`;
  const body = `Dhariwal Shortlist:\n${lines.join('\n')}\n\nView: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}
function buildSingleShare(sku){
  const url = `${location.origin}${location.pathname}?search=${encodeURIComponent(sku)}`;
  const body = `Interested in SKU ${sku}\nLink: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}
