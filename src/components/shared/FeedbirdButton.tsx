import React from 'react';
import { Button } from '../ui/button';
import { Loading } from './loadings';

type Props = {
  action: () => void;
  text: string;
  isLoading?: boolean;
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
  isLoading,
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
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <div
          className={`h-3.5 w-3.5 animate-spin rounded-full border-2 ${variation === 'primary' ? 'text-white' : 'text-grey'} border-t-transparent`}
        ></div>
      ) : (
        <>
          {startComponent && <div>{startComponent}</div>}
          {text}
          {endComponent && <div>{endComponent}</div>}
        </>
      )}
    </Button>
  );
}
