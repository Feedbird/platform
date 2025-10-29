'use client';
import { ServicesProvider } from '@/contexts/services/ServicesPageContext';
import React from 'react';

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ServicesProvider>{children}</ServicesProvider>;
}
