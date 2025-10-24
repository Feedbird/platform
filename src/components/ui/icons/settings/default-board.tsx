import React from 'react';
import { createIcon } from '../../icon';

export const DefaultBoardIcon = createIcon(
  <>
    <path d="M8 2V14" stroke="currentColor"/>
    <path d="M8 9.3335L14 9.3335" stroke="currentColor"/>
    <path d="M2 6.6665H8" stroke="currentColor"/>
    <path d="M12.6667 2H3.33333C2.59695 2 2 2.59695 2 3.33333V12.6667C2 13.403 2.59695 14 3.33333 14H12.6667C13.403 14 14 13.403 14 12.6667V3.33333C14 2.59695 13.403 2 12.6667 2Z" stroke="currentColor"/>
  </>,
  '0 0 16 16',
  'DefaultBoardIcon'
);

export default DefaultBoardIcon;
