import React from 'react';
import { createIcon } from '../../icon';

export const DraftIcon = createIcon(
  <>
    <rect width="14" height="14" rx="3" fill="currentColor"/>
    <path d="M4.1875 7H9.81348" stroke="var(--icon-color, currentColor)" strokeLinecap="round" strokeLinejoin="round"/>
  </>,
  '0 0 14 14',
  'DraftIcon'
);

export default DraftIcon;
