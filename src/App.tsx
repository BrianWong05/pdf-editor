import { useState, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { PDFUploader } from '@/features/editor/components/PDFUploader';
import { Workspace } from '@/features/editor/components/Workspace';
import { Toolbar, addImageToCanvas } from '@/features/toolbar/components/Toolbar';
import { PropertiesPanel } from '@/features/properties/components/PropertiesPanel';
import { ExportButton } from '@/features/export/components/ExportButton';

function App() {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);

  const handleDocumentLoaded = useCallback((document: PDFDocumentProxy) => {
    setPdfDocument(document);
  }, []);

  const handleImageUpload = useCallback((imageUrl: string) => {
    addImageToCanvas(imageUrl);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-800 text-white">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-700 flex items-center px-4 justify-between">
        <h1 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          PDF Editor
        </h1>
        {pdfDocument && <ExportButton document={pdfDocument} />}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {pdfDocument ? (
          <>
            {/* Toolbar */}
            <Toolbar onImageUpload={handleImageUpload} />

            {/* Workspace */}
            <Workspace document={pdfDocument} />

            {/* Properties Panel */}
            <PropertiesPanel />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <PDFUploader onDocumentLoaded={handleDocumentLoaded} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
