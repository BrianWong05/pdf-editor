import { useCallback, useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { loadPdfDocument } from '@/utils/pdfUtils';

interface PDFUploaderProps {
  onDocumentLoaded: (document: Awaited<ReturnType<typeof loadPdfDocument>>) => void;
}

export function PDFUploader({ onDocumentLoaded }: PDFUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setPdfFile = useEditorStore((state) => state.setPdfFile);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        setError('Please upload a valid PDF file');
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        setPdfFile(file);
        const document = await loadPdfDocument(file);
        onDocumentLoaded(document);
      } catch (err) {
        setError('Failed to load PDF. Please try another file.');
        console.error('PDF load error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [setPdfFile, onDocumentLoaded]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center
        w-full max-w-2xl mx-auto
        min-h-[300px] p-8
        border-2 border-dashed rounded-xl
        transition-all duration-200 ease-in-out
        cursor-pointer
        ${isDragging
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'
        }
      `}
    >
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300">Loading PDF...</p>
        </div>
      ) : (
        <>
          <svg
            className="w-16 h-16 text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-lg text-gray-300 mb-2">
            Drag & drop your PDF here
          </p>
          <p className="text-sm text-gray-500 mb-4">or</p>

          <label className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors">
            Browse Files
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleInputChange}
              className="hidden"
            />
          </label>

          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
