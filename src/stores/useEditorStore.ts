import type { ActiveTool } from '@/types/editor';
import { create } from 'zustand';

interface EditorState {
  // PDF document state
  pdfFile: File | null;
  numPages: number;
  currentPage: number;

  // Tools
  activeTool: ActiveTool;

  // Zoom
  zoomLevel: number;

  // Selected object for properties panel
  selectedObjectId: string | null;

  // Actions
  setPdfFile: (file: File | null) => void;
  setNumPages: (num: number) => void;
  setCurrentPage: (page: number) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setZoomLevel: (zoom: number) => void;
  setSelectedObjectId: (id: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  pdfFile: null,
  numPages: 0,
  currentPage: 1,
  activeTool: 'select',
  zoomLevel: 1,
  selectedObjectId: null,

  setPdfFile: (file) => set({ pdfFile: file }),
  setNumPages: (num) => set({ numPages: num }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
}));
