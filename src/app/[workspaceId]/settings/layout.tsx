"use client";

import React from "react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full bg-background">
      {children}
    </div>
  );
}



