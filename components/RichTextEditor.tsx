'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const addImage = useCallback(() => {
    const url = window.prompt('Bild URL eingeben:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('Link URL eingeben:', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('bold') ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <i className="ri-bold w-4 h-4 flex items-center justify-center"></i>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('italic') ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <i className="ri-italic w-4 h-4 flex items-center justify-center"></i>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('heading', { level: 1 }) ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('heading', { level: 2 }) ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('bulletList') ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <i className="ri-list-unordered w-4 h-4 flex items-center justify-center"></i>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('orderedList') ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <i className="ri-list-ordered w-4 h-4 flex items-center justify-center"></i>
        </button>

        <button
          type="button"
          onClick={addLink}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive('link') ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <i className="ri-link w-4 h-4 flex items-center justify-center"></i>
        </button>

        <button
          type="button"
          onClick={addImage}
          className="px-3 py-1 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100"
        >
          <i className="ri-image-line w-4 h-4 flex items-center justify-center"></i>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <i className="ri-align-left w-4 h-4 flex items-center justify-center"></i>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <i className="ri-align-center w-4 h-4 flex items-center justify-center"></i>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-3 py-1 rounded text-sm font-medium ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          <i className="ri-align-right w-4 h-4 flex items-center justify-center"></i>
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="min-h-[200px] max-h-[400px] overflow-y-auto"
        placeholder={placeholder}
      />
    </div>
  );
}