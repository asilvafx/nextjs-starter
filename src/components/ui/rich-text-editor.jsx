"use client";

import { useRef, useCallback } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link, Quote, Code, Heading1, Heading2 } from 'lucide-react';

// Simple, modern rich text editor using contentEditable
function SimpleRichTextEditor({ value, onChange, placeholder, className }) {
  const editorRef = useRef(null);

  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback((e) => {
    if (onChange) {
      onChange(e.target.innerHTML);
    }
  }, [onChange]);

  const insertHeading = useCallback((level) => {
    execCommand('formatBlock', `h${level}`);
  }, [execCommand]);

  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  return (
    <div className={`border rounded-lg ${className || ''}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => insertHeading(1)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertHeading(2)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={insertLink}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'blockquote')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('formatBlock', 'pre')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="p-4 min-h-[150px] focus:outline-none prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: value || '' }}
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{
          minHeight: '150px',
        }}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
          pointer-events: none;
        }
        [contenteditable] h1 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        [contenteditable] h2 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.5rem 0;
        }
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 0.5rem 0;
          font-style: italic;
        }
        [contenteditable] pre {
          background: #f3f4f6;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
          margin: 0.5rem 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

// Quill editor configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'align', 'list', 'bullet',
  'blockquote', 'code-block', 'link', 'image'
];

export function RichTextEditor({ value, onChange, placeholder, className, ...props }) {
  return (
    <SimpleRichTextEditor
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
}

export default RichTextEditor;