import React from 'react';
import { createIcon } from '../../icon';

export const TestIcon = createIcon(
  <>
    <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2"/>
    <path d="M8.5 2h7"/>
    <path d="M14.5 16h-5"/>
  </>,
  '0 0 24 24',
  'TestIcon'
);

export default TestIcon;
