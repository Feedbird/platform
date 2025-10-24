import React from 'react';
import { createIcon } from '../../icon';

export const StoryIcon = createIcon(
  <>
    <rect y="0.513672" width="15" height="15" rx="7.5" fill="var(--icon-color, currentColor)"/>
    <circle cx="7.5" cy="8.01355" r="4.71033" stroke="var(--icon-color, currentColor)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 2"/>
    <path d="M7.49963 12.7239C10.1011 12.7239 12.21 10.615 12.21 8.01355C12.21 5.41211 10.1011 3.30322 7.49963 3.30322" stroke="var(--icon-color, currentColor)" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M7.49963 5.854V10.1738" stroke="var(--icon-color, currentColor)" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9.65979 8.01367L5.33997 8.01367" stroke="var(--icon-color, currentColor)" strokeWidth="1.2" strokeLinecap="round"/>
  </>,
  '0 0 15 16',
  'StoryIcon'
);

export default StoryIcon;
