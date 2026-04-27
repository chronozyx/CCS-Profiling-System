/**
 * Shared PDF builder — used by both Admin Reports and Faculty Reports.
 * Generates a properly headed A4 landscape PDF with autoTable.
 */
export async function buildPdf(title, subtitle, columns, rows, filename, extraHeaderFn) {
  const { default: jsPDF }    = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoUrl = `${window.location.origin}/ccs.png`;
  let logoData  = null;
  try {
    const resp = await fetch(logoUrl);
    const blob = await resp.blob();
    logoData   = await new Promise(res => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch { /* logo optional */ }

  const logoSize = 22;
  if (logoData) doc.addImage(logoData, 'PNG', margin, 8, logoSize, logoSize);

  // ── Official header text ──────────────────────────────────────────────────
  const cx = pageW / 2;
  let ty    = 10;

  doc.setFont('times', 'normal').setFontSize(9).setTextColor(60, 60, 60);
  doc.text('Republic of the Philippines', cx, ty, { align: 'center' });

  ty += 6;
  doc.setFont('times', 'bold').setFontSize(16).setTextColor(0, 0, 0);
  doc.text('University of Cabuyao', cx, ty, { align: 'center' });

  ty += 5;
  doc.setFontSize(11);
  doc.text('(Pamantasan Ng Cabuyao)', cx, ty, { align: 'center' });

  ty += 5;
  doc.setFontSize(10).setFont('times', 'bolditalic');
  doc.text('College of Computing Studies', cx, ty, { align: 'center' });

  ty += 4;
  doc.setFont('times', 'normal').setFontSize(8).setTextColor(80, 80, 80);
  doc.text('Katapatan Mutual Homes, Brgy. Banay-banay, City of Cabuyao, Laguna 4025', cx, ty, { align: 'center' });

  // ── Divider ───────────────────────────────────────────────────────────────
  ty += 4;
  doc.setDrawColor(0).setLineWidth(0.5);
  doc.line(margin, ty, pageW - margin, ty);

  // ── Report title ──────────────────────────────────────────────────────────
  ty += 6;
  doc.setFont('times', 'bold').setFontSize(13).setTextColor(0, 0, 0);
  doc.text(title.toUpperCase(), cx, ty, { align: 'center' });

  ty += 5;
  doc.setFont('times', 'normal').setFontSize(9).setTextColor(100, 100, 100);
  doc.text(subtitle, cx, ty, { align: 'center' });

  ty += 4;
  doc.setFontSize(8);
  doc.text(
    `Total Records: ${rows.length}   |   Generated: ${new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}`,
    cx, ty, { align: 'center' }
  );

  // Optional extra header content (e.g. faculty info block)
  if (extraHeaderFn) ty = extraHeaderFn(doc, ty, margin, pageW);

  // ── Table ─────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: ty + 4,
    head:   [columns],
    body:   rows,
    margin: { left: margin, right: margin },
    styles:      { font: 'helvetica', fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles:  { fillColor: [26, 26, 46], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    didDrawPage: (data) => {
      const total = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal').setFontSize(7).setTextColor(150, 150, 150);
      doc.text(`Page ${data.pageNumber} of ${total}  |  CCS Profiling System`, pageW / 2, pageH - 6, { align: 'center' });
    },
  });

  doc.save(filename);
}
