import React from 'react';
import { TableForm } from './forms-table';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Props = {
  setFormTableData: React.Dispatch<React.SetStateAction<TableForm[]>>;
  originalData: TableForm[]; // Add original data to restore from
};

export default function FormSearchPopover({
  setFormTableData,
  originalData,
}: Props) {
  const [open, isOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  React.useEffect(() => {
    if (searchValue.length < 3) {
      setFormTableData(originalData);
      return;
    }

    const timeoutId = setTimeout(() => {
      setFormTableData((prev) => {
        return originalData.filter((form) => {
          const titleMatch = form.title
            ?.toLowerCase()
            .includes(searchValue.toLowerCase());

          const serviceMatch = form.services?.some((service) =>
            service.name?.toLowerCase().includes(searchValue.toLowerCase())
          );

          return titleMatch || serviceMatch;
        });
      });
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [searchValue, setFormTableData, originalData]);

  const handleClearSearch = () => {
    setSearchValue('');
    setFormTableData(originalData);
  };

  return (
    <Popover open={open} onOpenChange={isOpen}>
      <PopoverTrigger asChild>
        <div className="flex cursor-pointer items-center gap-1.5 rounded-xs px-2 py-[3px] shadow-none hover:bg-[#F4F5F6]">
          <SearchIcon size={14} color="black" />
          <span className="text-sm leading-[16px] font-medium text-black">
            Search
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[16vw] p-0" side="bottom" align="start">
        <div className="flex items-center justify-between rounded-t-xl border-b bg-gradient-to-r from-gray-50 to-white p-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Search</h3>
            <p className="mt-0.5 text-sm text-gray-600">
              Search for a name or service name
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearSearch}
              className="border-border-button cursor-pointer border bg-white text-sm font-medium shadow-none"
            >
              Clear search
            </Button>
          </div>
        </div>
        <div className="p-4">
          <Input
            className="border-buttonStroke rounded-sm"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
