import React from 'react';

type Props = {
  title: string;
  selected: boolean;
  onClickAction?: () => void;
  count: number;
};

export default function CountCard({
  title,
  count,
  onClickAction,
  selected,
}: Props) {
  return (
    <div
      className={`${selected ? 'border-main ring-main/10 w-full ring-2' : 'border-buttonStroke'} rounded-sm border-1 px-3 py-2 hover:cursor-pointer hover:bg-slate-50`}
      onClick={() => {
        if (onClickAction) {
          onClickAction();
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-normal text-[#838488]">{title}</span>
        <p
          className={`${selected ? 'text-main' : 'text-black'} text-base font-medium`}
        >
          {count}
        </p>
      </div>
    </div>
  );
}
