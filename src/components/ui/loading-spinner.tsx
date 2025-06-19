'use client';

import { useLoadingStore } from '@/lib/utils/loading/loading-store';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoadingSpinner() {
  const { isLoading, currentMessage, operations } = useLoadingStore();
  const [elapsedTime, setElapsedTime] = useState(0);

  // Update elapsed time for long-running operations
  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      const oldestOperation = Array.from(operations.values())
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

      if (oldestOperation) {
        const elapsed = Math.floor((Date.now() - oldestOperation.startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, operations]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 max-w-md mx-4"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              {operations.size > 1 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium">
                  {operations.size}
                </div>
              )}
            </div>

            {currentMessage && (
              <div className="text-center">
                <p className="text-sm text-gray-600">{currentMessage}</p>
                {elapsedTime > 5 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {elapsedTime}s elapsed
                  </p>
                )}
              </div>
            )}

            {operations.size > 1 && (
              <div className="w-full max-h-32 overflow-y-auto">
                {Array.from(operations.values()).map(op => (
                  <div key={op.id} className="text-xs text-gray-500 py-1">
                    <div className="flex justify-between items-center">
                      <span>{op.message}</span>
                      {op.progress !== undefined && (
                        <span>{Math.round(op.progress)}%</span>
                      )}
                    </div>
                    {op.progress !== undefined && (
                      <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${op.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 