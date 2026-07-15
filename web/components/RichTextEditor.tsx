"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Write your article..." }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline"],
        ["link"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ header: [1, 2, 3, false] }],
        ["clean"],
      ],
    }),
    []
  );

  const formats = [
    "bold",
    "italic",
    "underline",
    "link",
    "list",
    "header",
  ];

  return (
    <div className="quill-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="h-64 mb-2"
      />
      <style jsx>{`
        :global(.quill-editor .ql-container) {
          font-size: 16px;
          font-family: inherit;
        }

        :global(.quill-editor .ql-editor) {
          min-height: 250px;
          max-height: 400px;
          overflow-y: auto;
          padding: 12px;
        }

        :global(.quill-editor .ql-toolbar) {
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
          border-bottom: none;
        }

        :global(.quill-editor .ql-container) {
          border-radius: 0.5rem;
          border: 1px solid #d1d5db;
        }

        :global(.quill-editor .ql-toolbar button:hover) {
          color: #1f2937;
          background-color: #f3f4f6;
        }

        :global(.quill-editor .ql-toolbar button.ql-active) {
          color: #1f2937;
          background-color: #e5e7eb;
        }
      `}</style>
    </div>
  );
}
