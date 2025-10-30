'use client';
import { FormEditorProvider } from '@/contexts/forms/form-editor-context';
import React from 'react';

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return <FormEditorProvider>{children}</FormEditorProvider>;
}
