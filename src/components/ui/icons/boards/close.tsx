import React from 'react';
import { createIcon } from '../../icon';

export const CloseIcon = createIcon(
  <>
    <path d="M12 4L4 12" stroke="var(--icon-color, currentColor)" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 4L12 12" stroke="var(--icon-color, currentColor)" strokeLinecap="round" strokeLinejoin="round"/>
  </>,
  '0 0 16 16',
  'CloseIcon'
);

export default CloseIcon;
