import React from "react";
import TimezoneSelect, { ITimezone } from "react-timezone-select";
import { cn } from "@/lib/utils";

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

  React.useEffect(() => {
    try {
      // @ts-ignore – helper exists in lib typings
      const next = TimezoneSelect.findTimeZone ? TimezoneSelect.findTimeZone(value) : { value };
      setSelected(next as ITimezone);
    } catch {
      setSelected({ value } as ITimezone);
    }
  }, [value]);

  return (
    <div className={cn("w-full", className)}>
      <TimezoneSelect
        value={selected}
        onChange={(tz: any) => {
          setSelected(tz as ITimezone);
          onChange(tz.value);
        }}
        labelStyle="altName" // show friendly zone names
        displayValue="UTC"   // prepend offset like (UTC-08:00)
        styles={{
          control: (base) => ({
            ...base,
            border: 'none',
            boxShadow: 'none',
            background: 'transparent',
            minHeight: 36,
          }),
          container: (base) => ({ ...base, width: '100%' }),
          valueContainer: (base) => ({ ...base, paddingLeft: 8, paddingRight: 8 }),
          indicatorsContainer: (base) => ({ ...base, paddingRight: 6 }),
        }}
      />
    </div>
  );
} 