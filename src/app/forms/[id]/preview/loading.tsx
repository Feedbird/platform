import React from "react";

export default function Loading() {
  return (
    <div className="w-full h-full flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-3 text-gray-600">Loading form preview...</span>
    </div>
  );
}
