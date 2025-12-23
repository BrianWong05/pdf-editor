import { useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import * as fabric from 'fabric';

interface ExportButtonProps {
  document: PDFDocumentProxy;
}

export function ExportButton({ document }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();

      for (let i = 1; i <= document.numPages; i++) {
        const page = await document.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });

        // Create a combined canvas
        const combinedCanvas = window.document.createElement('canvas');
        combinedCanvas.width = viewport.width;
        combinedCanvas.height = viewport.height;
        const ctx = combinedCanvas.getContext('2d');

        if (!ctx) continue;

        // Render PDF page to the combined canvas
        await page.render({
          canvasContext: ctx,
          viewport,
          canvas: combinedCanvas,
        }).promise;

        // Find the corresponding Fabric canvas and overlay it
        const pageContainer = window.document.querySelector(
          `[data-page-number="${i}"]`
        ) as HTMLElement & { fabricCanvas?: fabric.Canvas };

        if (pageContainer?.fabricCanvas) {
          const fabricCanvas = pageContainer.fabricCanvas;

          // Deselect all objects before exporting
          fabricCanvas.discardActiveObject();
          fabricCanvas.renderAll();

          // Get Fabric canvas as image and draw on top
          const fabricImage = fabricCanvas.toDataURL({
            format: 'png',
            multiplier: 1,
          });

          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0);
              resolve();
            };
            img.src = fabricImage;
          });
        }

        // Convert combined canvas to PNG and embed in PDF
        const pngDataUrl = combinedCanvas.toDataURL('image/png');
        const pngBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer());
        const pngImage = await pdfDoc.embedPng(pngBytes);

        // Add a page with the combined image
        const pdfPage = pdfDoc.addPage([viewport.width, viewport.height]);
        pdfPage.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: viewport.width,
          height: viewport.height,
        });
      }

      // Save and download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = window.document.createElement('a');
      link.href = url;
      link.download = 'edited-document.pdf';
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`
        px-4 py-2 rounded-lg font-medium transition-all
        ${isExporting
          ? 'bg-gray-600 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700'
        }
      `}
    >
      {isExporting ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Exporting...
        </span>
      ) : (
        'Export PDF'
      )}
    </button>
  );
}
