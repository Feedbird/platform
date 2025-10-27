import React, { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Link,
  Type,
  List,
  ListOrdered,
  Undo,
  Redo,
} from "lucide-react";
import { sanitizeRichText } from "@/lib/utils/sanitize";

type Props = {
  value: string;
  setter: React.Dispatch<React.SetStateAction<string>>;
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
    const url = prompt("Enter URL:");
    if (url) {
      executeCommand("createLink", url);
    }
  };

  return (
    <div className="border border-buttonStroke rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => executeCommand("bold")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("italic")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={insertLink}
          className="p-2 hover:bg-gray-200 rounded"
          title="Link"
        >
          <Link size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("formatBlock", "h1")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Heading 1"
        >
          <Type size={16} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => executeCommand("insertUnorderedList")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("insertOrderedList")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => executeCommand("undo")}
          className="p-2 hover:bg-gray-200 rounded"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand("redo")}
          className="p-2 hover:bg-gray-200 rounded"
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
        className="min-h-[120px] p-4 focus:outline-none"
        style={{ minHeight: "120px" }}
        suppressContentEditableWarning={true}
      />
    </div>
  );
}
