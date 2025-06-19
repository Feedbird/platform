'use client';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, Filter, Table, Eye, EyeOff, Copy, Layers3 } from 'lucide-react';
import { ToolbarButton, ToolbarSeparator } from './toolbar-button';

export default function AirtableToolbar(props: {
  onNew: () => void;
  groupFields: string[];
  setGroupFields: (arr: string[]) => void;
  statusFilter: string[];
  setStatusFilter: (arr: string[]) => void;
  channelFilter: string[];
  setChannelFilter: (arr: string[]) => void;
  hidden: Record<string, boolean>;
  toggleColumn: (id: string) => void;
  density: string;
  setDensity: (d: string) => void;
  columns: { id: string; header: string }[];
}) {
  /* Helpers that keep Radix menu OPEN */
  const stayOpen = (fn: () => void) => (e: Event) => {
    e.preventDefault();
    fn();
  };
  const toggleArr = (arr: string[], setArr: any, key: string) =>
    setArr(arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key]);

  // Determine if some columns are hidden
  const someColumnsHidden = props.columns.some((col) => {
    // if props.hidden[col.id] === false => column is hidden
    // if undefined or true => column is visible
    return props.hidden[col.id] === false;
  });

  return (
    <div className="flex items-center gap-4 rounded-md border bg-muted/50 px-1 py-0.5">
      <ToolbarButton icon={Plus} label="New" onClick={props.onNew} active={false} />
      <ToolbarSeparator />

      {/* GROUP BY (multi) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            icon={Layers3}
            label="Group"
            active={props.groupFields.length > 0}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          {['status', 'format', 'channels'].map((key) => (
            <DropdownMenuCheckboxItem
              key={key}
              checked={props.groupFields.includes(key)}
              onSelect={stayOpen(() => toggleArr(props.groupFields, props.setGroupFields, key))}
            >
              {key}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* FILTER (multi) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            icon={Filter}
            label="Filter"
            active={props.statusFilter.length + props.channelFilter.length > 0}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <p className="px-2 pt-1 text-xs font-medium text-muted-foreground">Status</p>
          {['Draft','Pending','Needs Revisions','Approved','Scheduled','Posted','Failed'].map((st) => (
            <DropdownMenuCheckboxItem
              key={st}
              checked={props.statusFilter.includes(st)}
              onSelect={stayOpen(() => toggleArr(props.statusFilter, props.setStatusFilter, st))}
            >
              {st}
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator />
          <p className="px-2 text-xs font-medium text-muted-foreground">Channel</p>
          {['instagram','facebook','linkedin','pinterest','youtube','tiktok'].map((ch) => (
            <DropdownMenuCheckboxItem
              key={ch}
              checked={props.channelFilter.includes(ch)}
              onSelect={stayOpen(() => toggleArr(props.channelFilter, props.setChannelFilter, ch))}
            >
              {ch}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* HIDE / SHOW COLUMNS */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            // Switch icon depending on whether any column is hidden
            icon={someColumnsHidden ? EyeOff : Eye}
            label="Hide"
            active
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-60 w-60 overflow-y-auto">
          {props.columns.map((col) => {
            const label =
              typeof col.header === 'function' ? col.id : col.header;
            const isChecked =
              props.hidden[String(col.id)] === undefined
                ? true
                : props.hidden[String(col.id)];
            return (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={isChecked}
                onSelect={stayOpen(() => props.toggleColumn(col.id))}
              >
                {label}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* DENSITY */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton icon={Table} label="Density" active />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {['small', 'medium', 'large', 'x-large'].map((d) => (
            <DropdownMenuCheckboxItem
              key={d}
              checked={props.density === d}
              onSelect={() => props.setDensity(d)}
            >
              {d}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarSeparator />
      <ToolbarButton icon={Copy} label="Export" onClick={() => console.log('export CSV')} active />
    </div>
  );
}
