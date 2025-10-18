'use client';

import { Bold, Code, Heading1, Heading2, Italic, Link, List, ListOrdered, Quote, Underline } from 'lucide-react';
import { useCallback, useRef } from 'react';

// Simple, modern rich text editor using contentEditable
function SimpleRichTextEditor({ value, onChange, placeholder, className }) {
    const editorRef = useRef(null);

    const execCommand = useCallback(
        (command, value = null) => {
            document.execCommand(command, false, value);
            if (editorRef.current && onChange) {
                onChange(editorRef.current.innerHTML);
            }
        },
        [onChange]
    );

    const handleInput = useCallback(
        (e) => {
            if (onChange) {
                onChange(e.target.innerHTML);
            }
        },
        [onChange]
    );

    const insertHeading = useCallback(
        (level) => {
            execCommand('formatBlock', `h${level}`);
        },
        [execCommand]
    );

    const insertLink = useCallback(() => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    }, [execCommand]);

    return (
        <div className={`rounded-lg border ${className || ''}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 border-b bg-gray-50 p-2">
                <button
                    type="button"
                    onClick={() => insertHeading(1)}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Heading 1">
                    <Heading1 className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => insertHeading(2)}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Heading 2">
                    <Heading2 className="h-4 w-4" />
                </button>
                <div className="mx-1 w-px bg-gray-300" />
                <button
                    type="button"
                    onClick={() => execCommand('bold')}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Bold">
                    <Bold className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('italic')}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Italic">
                    <Italic className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('underline')}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Underline">
                    <Underline className="h-4 w-4" />
                </button>
                <div className="mx-1 w-px bg-gray-300" />
                <button
                    type="button"
                    onClick={() => execCommand('insertUnorderedList')}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Bullet List">
                    <List className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('insertOrderedList')}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Numbered List">
                    <ListOrdered className="h-4 w-4" />
                </button>
                <div className="mx-1 w-px bg-gray-300" />
                <button
                    type="button"
                    onClick={insertLink}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Insert Link">
                    <Link className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('formatBlock', 'blockquote')}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Quote">
                    <Quote className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('formatBlock', 'pre')}
                    className="rounded p-2 transition-colors hover:bg-gray-200"
                    title="Code Block">
                    <Code className="h-4 w-4" />
                </button>
            </div>

            {/* Editor */}
            <div
                ref={editorRef}
                contentEditable
                className="prose prose-sm min-h-[150px] max-w-none p-4 focus:outline-none"
                dangerouslySetInnerHTML={{ __html: value || '' }}
                onInput={handleInput}
                data-placeholder={placeholder}
                style={{
                    minHeight: '150px'
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
const _quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
    ]
};

const _quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'align',
    'list',
    'bullet',
    'blockquote',
    'code-block',
    'link',
    'image'
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
