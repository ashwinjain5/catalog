function buildMultiShare(selected){
  const lines = selected.map(i => `• ${i.sku}${i.qty?` x ${i.qty}`:''}${i.color?` (${i.color})`:''}${i.note?` — ${i.note}`:''}`);
  const url = location.href;
  const body = `Dhariwal Shortlist:\n${lines.join('\n')}\n\nView: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}
function buildSingleShare(sku){
  const url = `${location.origin}${location.pathname}?search=${encodeURIComponent(sku)}`;
  const body = `Interested in SKU ${sku}\nLink: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(body)}`;
}
