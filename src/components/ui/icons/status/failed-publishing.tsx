import React from 'react';
import { createIcon } from '../../icon';

export const FailedPublishingIcon = createIcon(
  <>
    <path d="M0 3C0 1.34315 1.34315 0 3 0H11C12.6569 0 14 1.34315 14 3V11C14 12.6569 12.6569 14 11 14H3C1.34315 14 0 12.6569 0 11V3Z" fill="currentColor"/>
    <path d="M7 7.5V4M7 10H7.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </>,
  '0 0 14 14',
  'FailedPublishingIcon'
);

export default FailedPublishingIcon;
