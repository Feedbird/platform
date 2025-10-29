import React from 'react';
import { Button } from '../ui/button';

type Props = {
  action: () => void;
  text: string;
  borderColor?: string;
  customClassName?: string;
  startComponent?: React.ReactNode;
  disabled?: boolean;
  endComponent?: React.ReactNode;
  variation: 'primary' | 'secondary';
};

export default function FeedbirdButton({
  action,
  text,
  startComponent,
  borderColor,
  customClassName,
  disabled = false,
  endComponent,
  variation = 'primary',
}: Props) {
  const buttonBorder = disabled
    ? 'black/20'
    : borderColor
      ? borderColor
      : variation === 'primary'
        ? 'black/10'
        : 'buttonStroke';
  return (
    <Button
      onClick={action}
      className={`border-1 border-${buttonBorder} flex h-full rounded-sm px-2 py-1 hover:cursor-pointer ${variation === 'primary' ? 'bg-main text-white' : 'hover:bg-buttonStroke bg-white text-black'} ${customClassName}`}
      variant="default"
      disabled={disabled}
    >
      {startComponent && <div>{startComponent}</div>}
      {text}
      {endComponent && <div>{endComponent}</div>}
    </Button>
  );
}
