'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

export default function Drawer({ open, title, children, onClose }:{
  open: boolean; title: string; children: ReactNode; onClose(): void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0,   opacity: 1 }}
          exit={{   x: 380, opacity: 0 }}
          transition={{ type: 'tween', duration: .25 }}
          className="fixed right-0 top-0 h-full w-[380px] bg-white border-l shadow-xl z-50 flex flex-col"
        >
          <header className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-base">{title}</h3>
            <button aria-label="close" onClick={onClose}><X size={18}/></button>
          </header>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
