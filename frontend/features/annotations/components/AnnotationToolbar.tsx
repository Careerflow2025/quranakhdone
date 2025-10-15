'use client';
import { useAnnotationStore } from '../state/useAnnotationStore';

export default function AnnotationToolbar(){
  const { tool, setTool, strokeWidth, setStrokeWidth, canUndo, canRedo } = useAnnotationStore();
  
  const isActive = (t: string) => tool === t;
  
  return (
    <div className="flex flex-wrap items-center justify-between px-2" role="toolbar" aria-label="Annotation tools">
      <div className="flex items-center gap-6">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
          <button 
            aria-label="Green pen (Press G)" 
            className={`
              px-4 py-2 rounded-md font-medium transition-all
              ${isActive('green_pen') 
                ? 'bg-emerald-500 text-white shadow-md transform scale-105' 
                : 'hover:bg-gray-200 text-gray-700'}
            `}
            onClick={() => setTool('green_pen')}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Correct
            </span>
          </button>
          
          <button 
            aria-label="Red pen (Press R)" 
            className={`
              px-4 py-2 rounded-md font-medium transition-all
              ${isActive('red_pen') 
                ? 'bg-red-500 text-white shadow-md transform scale-105' 
                : 'hover:bg-gray-200 text-gray-700'}
            `}
            onClick={() => setTool('red_pen')}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Incorrect
            </span>
          </button>
          
          <button 
            aria-label="Yellow highlighter (Press Y)" 
            className={`
              px-4 py-2 rounded-md font-medium transition-all
              ${isActive('yellow_highlight') 
                ? 'bg-yellow-500 text-white shadow-md transform scale-105' 
                : 'hover:bg-gray-200 text-gray-700'}
            `}
            onClick={() => setTool('yellow_highlight')}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Highlight
            </span>
          </button>
          
          <button 
            aria-label="Eraser (Press E)" 
            className={`
              px-4 py-2 rounded-md font-medium transition-all
              ${isActive('eraser') 
                ? 'bg-gray-600 text-white shadow-md transform scale-105' 
                : 'hover:bg-gray-200 text-gray-700'}
            `}
            onClick={() => setTool('eraser')}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eraser
            </span>
          </button>
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-gray-600">Stroke:</span>
          <input 
            aria-label="Stroke width" 
            className="w-24" 
            type="range" 
            min={2} 
            max={16} 
            value={strokeWidth} 
            onChange={e => setStrokeWidth(parseInt(e.target.value))} 
          />
          <span className="text-sm font-bold text-gray-800 min-w-[30px]">{strokeWidth}px</span>
        </div>
      </div>

      {/* History Controls */}
      <div className="flex items-center gap-2">
        <button 
          aria-label="Undo (Ctrl/⌘+Z)" 
          className={`
            px-3 py-2 rounded-md transition-all flex items-center gap-2
            ${!canUndo 
              ? 'opacity-40 cursor-not-allowed text-gray-400' 
              : 'hover:bg-gray-100 text-gray-700'}
          `}
          onClick={() => document.dispatchEvent(new CustomEvent('annot-undo'))}
          disabled={!canUndo}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Undo
        </button>
        
        <button 
          aria-label="Redo (Shift+Ctrl/⌘+Z)" 
          className={`
            px-3 py-2 rounded-md transition-all flex items-center gap-2
            ${!canRedo 
              ? 'opacity-40 cursor-not-allowed text-gray-400' 
              : 'hover:bg-gray-100 text-gray-700'}
          `}
          onClick={() => document.dispatchEvent(new CustomEvent('annot-redo'))}
          disabled={!canRedo}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
          Redo
        </button>
      </div>
    </div>
  );
}