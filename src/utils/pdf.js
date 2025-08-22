async function exportVisibleAsPDF(containerId){
  if (!containerId) containerId = "catalogue";
  if (!window.html2canvas || !window.jspdf){
    // Lazy load libs from CDN for minimal setup
    await Promise.all([
      import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'),
      import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js')
    ]);
  }
  const el = document.getElementById(containerId);
  if (!el) return;
  const canvas = await html2canvas(el, { scale: 2 });
  const img = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const ratio = pageWidth / canvas.width;
  pdf.addImage(img, 'PNG', 0, 0, canvas.width * ratio, canvas.height * ratio);
  pdf.save('catalogue.pdf');
}
