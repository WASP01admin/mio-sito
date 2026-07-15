"use client";

import React, { useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function RichTextEditorComponent({ value, onChange, placeholder = "Write your article..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    // Prevent double initialization
    if (quillRef.current) {
      // Update existing Quill instance if value changed externally
      if (value && value !== quillRef.current.root.innerHTML) {
        quillRef.current.root.innerHTML = value;
      }
      return;
    }

    // Clear any existing Quill instances
    const existingToolbar = editorRef.current.previousElementSibling;
    if (existingToolbar?.classList.contains("ql-toolbar")) {
      existingToolbar.remove();
    }

    // Initialize Quill (no link button - autolink handles URLs)
    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: placeholder,
      modules: {
        toolbar: [
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ header: [1, 2, 3, false] }],
          ["clean"],
        ],
      },
      formats: ["bold", "italic", "underline", "link", "list", "header"],
    });

    quillRef.current = quill;

    // Set initial value
    if (value) {
      quill.root.innerHTML = value;
    }

    // Handle text changes
    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      if (html !== "<p><br></p>") {
        onChange(html);
      } else {
        onChange("");
      }
    });

    setIsReady(true);

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  return (
    <div className="quill-editor-wrapper">
      <div ref={editorRef} className="quill-editor" />
      <style jsx>{`
        .quill-editor-wrapper {
          width: 100%;
        }

        :global(.quill-editor-wrapper .ql-container) {
          font-size: 16px;
          font-family: inherit;
        }

        :global(.quill-editor-wrapper .ql-editor) {
          min-height: 250px;
          max-height: 400px;
          overflow-y: auto;
          padding: 12px;
        }

        :global(.quill-editor-wrapper .ql-toolbar) {
          border-radius: 0.5rem 0.5rem 0 0;
          border: 1px solid #d1d5db;
          border-bottom: none;
        }

        :global(.quill-editor-wrapper .ql-container) {
          border-radius: 0 0 0.5rem 0.5rem;
          border: 1px solid #d1d5db;
        }

        :global(.quill-editor-wrapper .ql-toolbar button:hover) {
          color: #1f2937;
          background-color: #f3f4f6;
        }

        :global(.quill-editor-wrapper .ql-toolbar button.ql-active) {
          color: #1f2937;
          background-color: #e5e7eb;
        }

        :global(.quill-editor-wrapper .ql-toolbar.ql-snow) {
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
}

export default React.memo(RichTextEditorComponent);
