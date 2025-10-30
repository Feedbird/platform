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
import { Ellipsis } from 'lucide-react';
import { humanizeDate } from '@/lib/utils/transformers';
import { DynamicIcon } from '../shared/DynamicIcon';
import { DEFAULT_ICON_SVG } from '@/lib/constants/default-icon';
import { useServices } from '@/contexts/services/ServicesPageContext';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';

// TODO Remove periodicity, always prices per month and annual calculates with that info
type Props = {
  tableData: Service[];
};

function ServicesTableRow({ service }: { service: Service }) {
  const { setActiveService, activeWorkspaceId } = useServices();
  const router = useRouter();

  const handleRowClick = () => {
    setActiveService(service);
    router.push(`/${activeWorkspaceId}/admin/services/${service.id}`);
  };

  const plans = (service.service_plans ?? []).sort((a, b) => a.price - b.price);
  const initialPlan = plans.length ? plans[0] : null;
  const finalPlan = plans.length ? plans.slice(-1)[0] : null;

  const isSinglePlan =
    service.service_plans && service.service_plans.length === 1;
  const hasServices = plans.length > 0;
  return (
    <TableRow
      className="hover:cursor-pointer hover:bg-[#FBFBFB]"
      onClick={handleRowClick}
    >
      <TableCell className=""></TableCell>
      <TableCell className="items-center justify-between py-2.5 pr-4 pl-2">
        <div className="flex items-center gap-2">
          <div className="border-buttonStroke h-[30px] w-[30px] rounded-[6px] border-1 bg-white p-1.5">
            <DynamicIcon svg={service.icon?.svg ?? DEFAULT_ICON_SVG} />
          </div>
          <span className="text-sm font-medium text-black">{service.name}</span>
          {service.status === 2 && (
            <Badge className="text-darkGrey bg-elementStroke h-4 px-1.5 text-[11px] font-medium">
              Draft
            </Badge>
          )}
          {service.is_addon && (
            <Badge className="text-main h-4 bg-[#D7E9FF] px-1.5 text-[11px] font-medium">
              Add-on
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="items-center justify-between py-2.5 pr-4 pl-2">
        <span className="h-full text-sm font-normal text-black">
          {hasServices
            ? isSinglePlan
              ? `$${initialPlan?.price} / month`
              : `$${initialPlan?.price} - $${finalPlan?.price} / month`
            : 'N/A'}
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
        <div
          className="border-buttonStroke flex h-6 w-6 items-center justify-center rounded-[6px] border-1 bg-white hover:bg-[#eeeeee]"
          onClick={(e) => e.stopPropagation()}
        >
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
