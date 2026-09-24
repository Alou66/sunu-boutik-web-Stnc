// Export PDF du format "2 exemplaires" : chaque page rendue par InvoiceCopiesView
// (.invoice-copies.a4) devient une page A4 paysage, fidèle à l'aperçu écran.

const A4_LANDSCAPE_MM = { width: 297, height: 210 };
const MM_TO_PX = 96 / 25.4;
// Résolution de capture : 3x assure un texte net à l'impression.
const PIXEL_RATIO = 3;

export async function buildInvoiceCopiesPdf(container: HTMLElement): Promise<Blob> {
  const pages = Array.from(container.querySelectorAll<HTMLElement>(".invoice-copies.a4"));
  if (pages.length === 0) throw new Error("Aucune page à exporter");

  const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);

  const widthPx = Math.round(A4_LANDSCAPE_MM.width * MM_TO_PX);
  const heightPx = Math.round(A4_LANDSCAPE_MM.height * MM_TO_PX);

  // Les pages sont re-rendues hors écran à la taille A4 exacte : la capture ne dépend
  // ainsi ni de la largeur de la fenêtre ni du zoom (mobile, petit écran...).
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, { position: "fixed", top: "0", left: "-100000px", width: `${widthPx}px` });
  document.body.appendChild(host);

  try {
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });

    for (const [i, page] of pages.entries()) {
      const clone = page.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        width: `${widthPx}px`,
        maxWidth: "none",
        height: `${heightPx}px`,
        margin: "0",
        boxShadow: "none",
      });
      host.replaceChildren(clone);

      const dataUrl = await toPng(clone, {
        width: widthPx,
        height: heightPx,
        pixelRatio: PIXEL_RATIO,
        backgroundColor: "#ffffff",
        skipFonts: true,
      });
      if (i > 0) pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, 0, A4_LANDSCAPE_MM.width, A4_LANDSCAPE_MM.height, undefined, "FAST");
    }

    return pdf.output("blob");
  } finally {
    host.remove();
  }
}
