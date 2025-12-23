import { useEditorStore } from '@/stores/useEditorStore';
import type { ActiveTool } from '@/types/editor';
import * as fabric from 'fabric';

const tools: { id: ActiveTool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '🖱️' },
  { id: 'text', label: 'Text', icon: 'T' },
  { id: 'image', label: 'Image', icon: '🖼️' },
  { id: 'draw', label: 'Draw', icon: '✏️' },
  { id: 'eraser', label: 'Eraser', icon: '🗑️' },
];

interface ToolbarProps {
  onImageUpload?: (imageUrl: string) => void;
}

export function Toolbar({ onImageUpload }: ToolbarProps) {
  const activeTool = useEditorStore((state) => state.activeTool);
  const setActiveTool = useEditorStore((state) => state.setActiveTool);
  const zoomLevel = useEditorStore((state) => state.zoomLevel);
  const setZoomLevel = useEditorStore((state) => state.setZoomLevel);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onImageUpload?.(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleZoomIn = () => {
    setZoomLevel(Math.min(zoomLevel + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(Math.max(zoomLevel - 0.25, 0.5));
  };

  return (
    <div className="w-16 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-4 gap-2">
      {/* Tool Buttons */}
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          title={tool.label}
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            text-xl transition-all duration-150
            ${activeTool === tool.id
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }
          `}
        >
          {tool.id === 'image' ? (
            <label className="cursor-pointer w-full h-full flex items-center justify-center">
              {tool.icon}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          ) : (
            tool.icon
          )}
        </button>
      ))}

      {/* Divider */}
      <div className="w-8 h-px bg-gray-700 my-2" />

      {/* Zoom Controls */}
      <button
        onClick={handleZoomIn}
        title="Zoom In"
        className="w-12 h-12 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white flex items-center justify-center text-xl"
      >
        +
      </button>
      <span className="text-gray-400 text-xs">{Math.round(zoomLevel * 100)}%</span>
      <button
        onClick={handleZoomOut}
        title="Zoom Out"
        className="w-12 h-12 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white flex items-center justify-center text-xl"
      >
        −
      </button>
    </div>
  );
}

// Add image to the currently visible page's Fabric canvas
export function addImageToCanvas(imageUrl: string) {
  const pageContainers = document.querySelectorAll('[data-page-number]');
  const firstPage = pageContainers[0] as HTMLElement & { fabricCanvas?: fabric.Canvas };

  if (firstPage?.fabricCanvas) {
    fabric.FabricImage.fromURL(imageUrl).then((img) => {
      img.scaleToWidth(200);
      img.set({
        left: 100,
        top: 100,
        name: `image-${Date.now()}`,
      });
      firstPage.fabricCanvas!.add(img);
      firstPage.fabricCanvas!.setActiveObject(img);
      firstPage.fabricCanvas!.renderAll();
    });
  }
}
