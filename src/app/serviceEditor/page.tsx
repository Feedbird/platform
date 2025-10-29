import ServicesHeader from '@/components/services/ServicesHeader';
import React from 'react';

export default function ServiceEditor() {
  return (
    <main className="flex min-h-screen flex-col bg-[#FBFBFB]">
      <ServicesHeader selectedServiceTitle="New Service" />
      <div className="flex justify-center p-6">
        <div className="border-buttonStroke flex w-full max-w-[1000px] flex-col rounded-[8px] border-1 bg-white px-4 py-3"></div>
      </div>
    </main>
  );
}
