import { useEffect, useRef, useState, useCallback } from 'react';
import type { PDFPageProxy, RenderTask } from 'pdfjs-dist';
import { useEditorStore } from '@/stores/useEditorStore';
import * as fabric from 'fabric';

interface PageRendererProps {
  page: PDFPageProxy;
  pageNumber: number;
  scale?: number;
}

export function PageRenderer({ page, pageNumber, scale = 1.5 }: PageRendererProps) {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const activeTool = useEditorStore((state) => state.activeTool);
  const setSelectedObjectId = useEditorStore((state) => state.setSelectedObjectId);

  // Render PDF page to background canvas - with proper cleanup
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas || !page) return;

    // Cancel any existing render operation
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const viewport = page.getViewport({ scale });
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Store the render task so we can cancel it if needed
    const renderTask = page.render({
      canvasContext: context,
      viewport,
      canvas,
    });

    renderTaskRef.current = renderTask;

    renderTask.promise
      .then(() => {
        setDimensions({ width: viewport.width, height: viewport.height });
      })
      .catch((error) => {
        // Ignore cancellation errors
        if (error?.name !== 'RenderingCancelledException') {
          console.error('PDF render error:', error);
        }
      });

    return () => {
      // Cancel render operation on cleanup
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [page, scale]);

  // Initialize Fabric.js overlay canvas
  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas || dimensions.width === 0) return;

    // Dispose existing instance
    if (fabricRef.current) {
      fabricRef.current.dispose();
      fabricRef.current = null;
    }

    // Create new Fabric canvas
    const fabricCanvas = new fabric.Canvas(overlayCanvas, {
      width: dimensions.width,
      height: dimensions.height,
      selection: activeTool === 'select',
    });

    // Handle object selection
    fabricCanvas.on('selection:created', (e) => {
      const selected = e.selected?.[0];
      if (selected) {
        setSelectedObjectId(selected.get('name') ?? null);
      }
    });

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObjectId(null);
    });

    fabricRef.current = fabricCanvas;

    // Expose fabric canvas on container
    const container = containerRef.current;
    if (container) {
      (container as HTMLDivElement & { fabricCanvas?: fabric.Canvas }).fabricCanvas = fabricCanvas;
    }

    return () => {
      fabricCanvas.dispose();
      fabricRef.current = null;
    };
  }, [dimensions, setSelectedObjectId, activeTool]);

  // Update Fabric canvas mode based on active tool
  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;

    // Reset modes
    fabricCanvas.isDrawingMode = false;
    fabricCanvas.selection = false;
    fabricCanvas.forEachObject((obj) => {
      obj.selectable = false;
      obj.evented = false;
    });

    switch (activeTool) {
      case 'select':
        fabricCanvas.selection = true;
        fabricCanvas.forEachObject((obj) => {
          obj.selectable = true;
          obj.evented = true;
        });
        break;

      case 'draw':
        fabricCanvas.isDrawingMode = true;
        fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
        fabricCanvas.freeDrawingBrush.color = '#ef4444'; // Red
        fabricCanvas.freeDrawingBrush.width = 3;
        break;

      case 'text':
        // Text is handled by click events
        break;

      case 'image':
        // Image upload handled separately
        break;

      case 'eraser':
        // Eraser mode - click to delete objects
        break;
    }
  }, [activeTool]);

  // Handle canvas clicks for text/eraser tools
  useEffect(() => {
    const fabricCanvas = fabricRef.current;
    if (!fabricCanvas) return;

    const handleMouseDown = (e: fabric.TPointerEventInfo<fabric.TPointerEvent>) => {
      if (activeTool === 'text' && !e.target) {
        const pointer = fabricCanvas.getScenePoint(e.e);
        const text = new fabric.IText('Edit me', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 24,
          fill: '#000000',
          fontFamily: 'Arial',
          name: `text-${Date.now()}`,
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        text.enterEditing();
      }

      if (activeTool === 'eraser' && e.target) {
        fabricCanvas.remove(e.target);
        fabricCanvas.renderAll();
      }
    };

    fabricCanvas.on('mouse:down', handleMouseDown);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
    };
  }, [activeTool]);

  return (
    <div
      ref={containerRef}
      data-page-number={pageNumber}
      className="relative mb-4 shadow-lg rounded-lg overflow-hidden bg-white"
      style={{ width: dimensions.width || 'auto', height: dimensions.height || 'auto' }}
    >
      {/* PDF Background Layer */}
      <canvas
        ref={backgroundCanvasRef}
        className="absolute top-0 left-0"
        style={{ zIndex: 1 }}
      />

      {/* Fabric.js Interactive Layer */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0"
        style={{ zIndex: 2 }}
      />
    </div>
  );
}
