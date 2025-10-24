import React from 'react';
import { createIcon } from '../../icon';

export const SkeletonLineIcon = createIcon(
  <path opacity="0.8" d="M0 3.5C0 1.84315 1.34315 0.5 3 0.5H90C91.6569 0.5 93 1.84315 93 3.5C93 5.15685 91.6569 6.5 90 6.5H3C1.34315 6.5 0 5.15685 0 3.5Z" fill="var(--icon-color, currentColor)"/>,
  '0 0 93 7',
  'SkeletonLineIcon'
);

export default SkeletonLineIcon;
