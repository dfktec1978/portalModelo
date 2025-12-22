"use client";

import { useRef, useCallback } from 'react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Editor({ value, onChange, placeholder }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="w-full border border-gray-300 rounded-lg">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b border-gray-200 bg-gray-100">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="px-3 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded hover:bg-gray-800 transition-colors"
          title="Negrito"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="px-3 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded hover:bg-gray-800 transition-colors"
          title="Itálico"
        >
          <em className="not-italic">I</em>
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="px-3 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded hover:bg-gray-800 transition-colors"
          title="Sublinhado"
        >
          <u className="no-underline">U</u>
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="px-3 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded hover:bg-gray-800 transition-colors"
          title="Lista"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="px-3 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded hover:bg-gray-800 transition-colors"
          title="Lista numerada"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => execCommand('createLink', prompt('Digite a URL:', 'https://') || '')}
          className="px-3 py-1 text-sm bg-gray-700 text-white border border-gray-600 rounded hover:bg-gray-800 transition-colors"
          title="Link"
        >
          🔗
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-0"
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        style={{
          outline: 'none'
        }}
        onFocus={(e) => {
          if (e.currentTarget.innerHTML === '' && placeholder) {
            e.currentTarget.innerHTML = `<span style="color: #9CA3AF; font-style: italic;">${placeholder}</span>`;
          }
        }}
        onBlur={(e) => {
          if (e.currentTarget.innerHTML === `<span style="color: #9CA3AF; font-style: italic;">${placeholder}</span>`) {
            e.currentTarget.innerHTML = '';
          }
        }}
      />
    </div>
  );
}