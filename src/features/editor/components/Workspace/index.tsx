import { useState, useCallback, useRef, useEffect } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';
import { PageRenderer } from '@/features/editor/components/PageRenderer';
import { useEditorStore } from '@/stores/useEditorStore';

interface WorkspaceProps {
  document: PDFDocumentProxy | null;
}

export function Workspace({ document }: WorkspaceProps) {
  const [pages, setPages] = useState<PDFPageProxy[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const setNumPages = useEditorStore((state) => state.setNumPages);
  const zoomLevel = useEditorStore((state) => state.zoomLevel);

  // Load all pages when document changes
  useEffect(() => {
    if (!document) {
      setPages([]);
      return;
    }

    const loadPages = async () => {
      const numPages = document.numPages;
      setNumPages(numPages);

      const loadedPages: PDFPageProxy[] = [];
      for (let i = 1; i <= numPages; i++) {
        const page = await document.getPage(i);
        loadedPages.push(page);
      }
      setPages(loadedPages);
    };

    loadPages();
  }, [document, setNumPages]);

  const handleScroll = useCallback(() => {
    // Placeholder for virtualization logic
    // Could implement lazy loading of fabric canvases here
  }, []);

  if (!document) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-auto bg-gray-700 p-6"
    >
      <div className="flex flex-col items-center gap-4">
        {pages.map((page, index) => (
          <PageRenderer
            key={index}
            page={page}
            pageNumber={index + 1}
            scale={1.5 * zoomLevel}
          />
        ))}
      </div>
    </div>
  );
}
