import { useEditorStore } from '@/stores/useEditorStore';
import * as fabric from 'fabric';

export function PropertiesPanel() {
  const selectedObjectId = useEditorStore((state) => state.selectedObjectId);
  const activeTool = useEditorStore((state) => state.activeTool);

  // Get the selected object from the DOM
  const getSelectedObject = (): fabric.FabricObject | null => {
    const pageContainers = document.querySelectorAll('[data-page-number]');
    for (const container of pageContainers) {
      const fabricCanvas = (container as HTMLElement & { fabricCanvas?: fabric.Canvas }).fabricCanvas;
      if (fabricCanvas) {
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject) return activeObject;
      }
    }
    return null;
  };

  const updateActiveObject = (updates: Partial<fabric.FabricObject>) => {
    const obj = getSelectedObject();
    if (!obj) return;

    const pageContainers = document.querySelectorAll('[data-page-number]');
    for (const container of pageContainers) {
      const fabricCanvas = (container as HTMLElement & { fabricCanvas?: fabric.Canvas }).fabricCanvas;
      if (fabricCanvas && fabricCanvas.getActiveObject() === obj) {
        obj.set(updates);
        fabricCanvas.renderAll();
        break;
      }
    }
  };

  if (!selectedObjectId) {
    return (
      <div className="w-64 bg-gray-900 border-l border-gray-700 p-4">
        <h3 className="text-gray-400 text-sm font-medium mb-4">Properties</h3>
        <p className="text-gray-500 text-sm">
          {activeTool === 'select'
            ? 'Select an element to edit its properties'
            : `Using ${activeTool} tool`
          }
        </p>
      </div>
    );
  }

  const selectedObject = getSelectedObject();
  const isText = selectedObject instanceof fabric.IText || selectedObject instanceof fabric.Textbox;

  return (
    <div className="w-64 bg-gray-900 border-l border-gray-700 p-4">
      <h3 className="text-gray-400 text-sm font-medium mb-4">Properties</h3>

      {/* Position */}
      <div className="mb-4">
        <label className="text-gray-500 text-xs uppercase tracking-wide">Position</label>
        <div className="flex gap-2 mt-1">
          <div className="flex-1">
            <span className="text-gray-400 text-xs">X</span>
            <input
              type="number"
              value={Math.round(selectedObject?.left ?? 0)}
              onChange={(e) => updateActiveObject({ left: Number(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
            />
          </div>
          <div className="flex-1">
            <span className="text-gray-400 text-xs">Y</span>
            <input
              type="number"
              value={Math.round(selectedObject?.top ?? 0)}
              onChange={(e) => updateActiveObject({ top: Number(e.target.value) })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Text Properties */}
      {isText && (
        <>
          <div className="mb-4">
            <label className="text-gray-500 text-xs uppercase tracking-wide">Font Size</label>
            <input
              type="number"
              value={(selectedObject as fabric.IText).fontSize ?? 24}
              onChange={(e) => updateActiveObject({ fontSize: Number(e.target.value) } as Parameters<fabric.IText['set']>[0])}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm mt-1"
            />
          </div>

          <div className="mb-4">
            <label className="text-gray-500 text-xs uppercase tracking-wide">Color</label>
            <input
              type="color"
              value={String((selectedObject as fabric.IText).fill ?? '#000000')}
              onChange={(e) => updateActiveObject({ fill: e.target.value })}
              className="w-full h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer mt-1"
            />
          </div>

          <div className="mb-4">
            <label className="text-gray-500 text-xs uppercase tracking-wide">Font Family</label>
            <select
              value={(selectedObject as fabric.IText).fontFamily ?? 'Arial'}
              onChange={(e) => updateActiveObject({ fontFamily: e.target.value } as Parameters<fabric.IText['set']>[0])}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm mt-1"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>
        </>
      )}

      {/* Opacity */}
      <div className="mb-4">
        <label className="text-gray-500 text-xs uppercase tracking-wide">Opacity</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={selectedObject?.opacity ?? 1}
          onChange={(e) => updateActiveObject({ opacity: Number(e.target.value) })}
          className="w-full mt-1"
        />
      </div>

      {/* Delete Button */}
      <button
        onClick={() => {
          const obj = getSelectedObject();
          if (!obj) return;
          const pageContainers = document.querySelectorAll('[data-page-number]');
          for (const container of pageContainers) {
            const fabricCanvas = (container as HTMLElement & { fabricCanvas?: fabric.Canvas }).fabricCanvas;
            if (fabricCanvas && fabricCanvas.getActiveObject() === obj) {
              fabricCanvas.remove(obj);
              fabricCanvas.renderAll();
              break;
            }
          }
        }}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
