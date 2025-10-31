import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Link,
  Type,
  List,
  ListOrdered,
  Undo,
  Redo,
} from 'lucide-react';
import { sanitizeRichText } from '@/lib/utils/sanitize';

type Props = {
  value: string;
  setter:
    | React.Dispatch<React.SetStateAction<string>>
    | ((val: string) => void);
};

export default function AdvancedTextArea({ value, setter }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync value with contentEditable
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = sanitizeRichText(value);
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      // Sanitize the HTML content before setting it
      const sanitizedContent = sanitizeRichText(editorRef.current.innerHTML);
      setter(sanitizedContent);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  return (
    <div className="border-buttonStroke overflow-hidden rounded-[6px] border-1 bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-[#FBFBFB] p-1 py-0.5">
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="rounded p-2 hover:bg-gray-200"
          title="Bold"
        >
          <Bold size={14} color="black" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="rounded p-2 hover:bg-gray-200"
          title="Italic"
        >
          <Italic size={14} color="black" />
        </button>
        <button
          type="button"
          onClick={insertLink}
          className="rounded p-2 hover:bg-gray-200"
          title="Link"
        >
          <Link size={14} color="black" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('formatBlock', 'h1')}
          className="rounded p-2 hover:bg-gray-200"
          title="Heading 1"
        >
          <Type size={14} color="black" />
        </button>
        <div className="mx-1 h-6 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="rounded p-2 hover:bg-gray-200"
          title="Bullet List"
        >
          <List size={16} color="black" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="rounded p-2 hover:bg-gray-200"
          title="Numbered List"
        >
          <ListOrdered size={16} color="black" />
        </button>
        <div className="mx-1 h-6 w-px bg-gray-300" />
        <button
          type="button"
          onClick={() => executeCommand('undo')}
          className="rounded p-2 hover:bg-gray-200"
          title="Undo"
        >
          <Undo size={14} color="black" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('redo')}
          className="rounded p-2 hover:bg-gray-200"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="max-h-[350px] min-h-[120px] overflow-auto p-4 text-sm text-black focus:outline-none"
        style={{ minHeight: '90px' }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
}
