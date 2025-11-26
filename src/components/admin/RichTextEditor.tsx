import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Écrivez votre contenu ici...',
  className = ''
}) => {
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
      ]
    },
    clipboard: {
      matchVisual: false
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'color', 'background',
    'link', 'image'
  ];

  return (
    <div className={`rich-text-editor ${className}`}>
      <style>{`
        .rich-text-editor .quill {
          background: rgb(55 65 81);
          border-radius: 0.5rem;
          border: 1px solid rgb(75 85 99);
        }

        .rich-text-editor .ql-toolbar {
          background: rgb(55 65 81);
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border: 1px solid rgb(75 85 99);
          border-bottom: 1px solid rgb(75 85 99);
        }

        .rich-text-editor .ql-container {
          background: rgb(55 65 81);
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border: none;
          color: white;
          font-size: 14px;
          min-height: 300px;
        }

        .rich-text-editor .ql-editor {
          color: white;
          min-height: 300px;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: rgb(156 163 175);
          font-style: normal;
        }

        .rich-text-editor .ql-snow .ql-stroke {
          stroke: rgb(209 213 219);
        }

        .rich-text-editor .ql-snow .ql-fill {
          fill: rgb(209 213 219);
        }

        .rich-text-editor .ql-snow .ql-picker-label {
          color: rgb(209 213 219);
        }

        .rich-text-editor .ql-snow.ql-toolbar button:hover,
        .rich-text-editor .ql-snow .ql-toolbar button:hover,
        .rich-text-editor .ql-snow.ql-toolbar button:focus,
        .rich-text-editor .ql-snow .ql-toolbar button:focus,
        .rich-text-editor .ql-snow.ql-toolbar button.ql-active,
        .rich-text-editor .ql-snow .ql-toolbar button.ql-active,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label:hover,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-label:hover,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-label.ql-active,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item:hover,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item:hover,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
          color: rgb(239 68 68);
        }

        .rich-text-editor .ql-snow.ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-snow .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar button:focus .ql-stroke,
        .rich-text-editor .ql-snow .ql-toolbar button:focus .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke,
        .rich-text-editor .ql-snow .ql-toolbar button.ql-active .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar button:hover .ql-stroke-miter,
        .rich-text-editor .ql-snow .ql-toolbar button:hover .ql-stroke-miter,
        .rich-text-editor .ql-snow.ql-toolbar button:focus .ql-stroke-miter,
        .rich-text-editor .ql-snow .ql-toolbar button:focus .ql-stroke-miter,
        .rich-text-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke-miter,
        .rich-text-editor .ql-snow .ql-toolbar button.ql-active .ql-stroke-miter,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke-miter,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-label:hover .ql-stroke-miter,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-stroke-miter,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item:hover .ql-stroke-miter,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item:hover .ql-stroke-miter,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-stroke-miter {
          stroke: rgb(239 68 68);
        }

        .rich-text-editor .ql-snow.ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-snow .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar button:focus .ql-fill,
        .rich-text-editor .ql-snow .ql-toolbar button:focus .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar button.ql-active .ql-fill,
        .rich-text-editor .ql-snow .ql-toolbar button.ql-active .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label:hover .ql-fill,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-label:hover .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-label.ql-active .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item:hover .ql-fill,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item:hover .ql-fill,
        .rich-text-editor .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill,
        .rich-text-editor .ql-snow .ql-toolbar .ql-picker-item.ql-selected .ql-fill {
          fill: rgb(239 68 68);
        }

        .rich-text-editor .ql-snow .ql-picker-options {
          background: rgb(55 65 81);
          border: 1px solid rgb(75 85 99);
        }

        .rich-text-editor .ql-editor h1,
        .rich-text-editor .ql-editor h2,
        .rich-text-editor .ql-editor h3 {
          color: white;
        }

        .rich-text-editor .ql-editor a {
          color: rgb(96 165 250);
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
