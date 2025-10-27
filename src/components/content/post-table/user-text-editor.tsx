"use client";
import * as React from "react";
import { motion, useDragControls } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function UserTextEditor({
  open,
  title,
  value,
  onClose,
  onChange,
}: {
  open: boolean;
  title: string;
  value: string;
  onClose: () => void;
  onChange?: (newVal: string) => void;
}) {
  const dragControls = useDragControls();
  const [draft, setDraft] = React.useState<string>(value ?? "");
  const isInitialMount = React.useRef(true);
  const hasOpened = React.useRef(false);

  // Initialize draft on open and when incoming value changes on first open
  React.useEffect(() => {
    if (open && !hasOpened.current) {
      setDraft(value ?? "");
      isInitialMount.current = true;
      hasOpened.current = true;
    } else if (!open) {
      hasOpened.current = false;
    }
  }, [open, value]);

  // Debounced auto-save mirroring CaptionEditor
  React.useEffect(() => {
    if (!open) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const handler = setTimeout(() => {
      onChange?.(draft);
    }, 500);
    return () => clearTimeout(handler);
  }, [draft, onChange, open]);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        id="usertext-float"
        drag
        dragListener={false}
        dragControls={dragControls}
        dragMomentum={false}
        className="w-[480px] max-w-[95vw] bg-gray-100 rounded-lg shadow-2xl border border-gray-400"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* header */}
        <div
          className="flex items-center justify-between p-3 cursor-move border-b bg-white rounded-t-lg"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600 cursor-pointer h-8 w-8"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* body */}
        <div className="px-3 py-4" onPointerDown={(e) => e.stopPropagation()}>
          <textarea
            rows={8}
            className="
              w-full rounded-md border px-2 py-1 text-sm
              resize-none focus:outline-none
              bg-white border-gray-300 h-64
            "
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

