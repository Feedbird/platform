import React from "react";
import TimezoneSelect, { ITimezone } from "react-timezone-select";

interface Props {
  value: string;
  onChange: (tz: string) => void;
  className?: string;
}

export function TimezonePicker({ value, onChange, className }: Props) {
  // Normalize initial value to library format
  const [selected, setSelected] = React.useState<ITimezone>(() => {
    try {
      // @ts-ignore – helper exists in lib typings
      return TimezoneSelect.findTimeZone ? TimezoneSelect.findTimeZone(value) : { value };
    } catch {
      return { value } as ITimezone;
    }
  });

  return (
    <div className={className}>
      <TimezoneSelect
        value={selected}
        onChange={(tz: any) => {
          setSelected(tz as ITimezone);
          onChange(tz.value);
        }}
        labelStyle="altName" // show friendly zone names
        displayValue="UTC"   // prepend offset like (UTC-08:00)
      />
    </div>
  );
} 