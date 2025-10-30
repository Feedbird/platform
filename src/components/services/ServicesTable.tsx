import { Service } from '@/lib/store/types';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { BoxIcon, Ellipsis } from 'lucide-react';
import { humanizeDate } from '@/lib/utils/transformers';
import { DynamicIcon } from '../shared/DynamicIcon';
import { DEFAULT_ICON_SVG } from '@/lib/constants/default-icon';

// TODO Remove periodicity, always prices per month and annual calculates with that info
type Props = {
  tableData: Service[];
};

function ServicesTableRow({ service }: { service: Service }) {
  const initialPlan = service.service_plans ? service.service_plans[0] : null;
  const finalPlan = service.service_plans
    ? service.service_plans.slice(-1)[0]
    : null;

  const isSinglePlan =
    service.service_plans && service.service_plans.length === 1;
  return (
    <TableRow className="hover:cursor-pointer hover:bg-[#FBFBFB]">
      <TableCell className=""></TableCell>
      <TableCell className="items-center justify-between py-2.5 pr-4 pl-2">
        <div className="flex items-center gap-2">
          <div className="border-buttonStroke rounded-[6px] border-1 bg-white p-1.5">
            <DynamicIcon svg={service.icon?.svg ?? DEFAULT_ICON_SVG} />
          </div>
          <span className="text-sm font-medium text-black">{service.name}</span>
        </div>
      </TableCell>
      <TableCell className="items-center justify-between py-2.5 pr-4 pl-2">
        <span className="h-full text-sm font-normal text-black">
          {isSinglePlan
            ? `$${initialPlan?.price} / month`
            : `$${initialPlan?.price} - $${finalPlan?.price} / month`}
        </span>
      </TableCell>
      <TableCell className="items-center justify-between py-2.5 pr-4 pl-2">
        <span className="h-full text-sm font-normal text-black/60">
          {humanizeDate(service.created_at)}
        </span>
      </TableCell>
      <TableCell className="items-center justify-between py-2.5 pr-4 pl-2">
        <span className="h-full text-sm font-normal text-black/60">
          {humanizeDate(service.updated_at)}
        </span>
      </TableCell>
      <TableCell className="items-center px-2 py-1.5">
        <div className="border-buttonStroke flex h-6 w-6 items-center justify-center rounded-[6px] border-1 bg-white hover:bg-[#eeeeee]">
          <Ellipsis size={14} color="#838488" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function ServicesTable({ tableData }: Props) {
  return (
    <Table className="border-buttonStroke border-b-1">
      <TableHeader className="border-y-1 bg-[#FBFBFB]">
        <TableRow className="">
          <TableHead className="w-12">
            <Checkbox
              className="border-buttonStroke border-1 shadow-none"
              checked={false}
            />
          </TableHead>
          <TableHead className="w-1/3 font-medium text-black">Name</TableHead>
          <TableHead className="font-medium text-black">Price</TableHead>
          <TableHead className="w-1/6 font-medium text-black">
            Created
          </TableHead>
          <TableHead className="w-1/6 font-medium text-black">
            Updated
          </TableHead>
          <TableHead className="w-[5%]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tableData.map((service) => (
          <ServicesTableRow key={service.id} service={service} />
        ))}
      </TableBody>
    </Table>
  );
}
