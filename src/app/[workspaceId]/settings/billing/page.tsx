"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { CreditCard, Landmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentMethod = {
  id: string;
  type: "visa" | "mastercard" | "bank";
  last4: string;
  expires: string; // e.g. "Jan 2029" or "—"
  currency: string; // e.g. USD
  primary?: boolean;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "pm_1", type: "visa", last4: "1234", expires: "Jan 2029", currency: "USD", primary: true },
  { id: "pm_2", type: "bank", last4: "4321", expires: "", currency: "USD" },
];

type Subscription = {
  id: string;
  price: string;
  status: "overdue" | "active";
  created: string;
  nextPayment: string;
};

const SUBSCRIPTIONS: Subscription[] = [
  { id: "sub_1", price: "$900", status: "overdue", created: "01/17/2025", nextPayment: "02/17/2025" },
  { id: "sub_2", price: "$14,500 / year", status: "active", created: "01/17/2025", nextPayment: "02/17/2025" },
];

type Invoice = {
  id: string;
  price: string;
  status: "overdue" | "active" | "paid" | "open" | "primary";
  created: string;
  due: string;
  payment: string;
  invoiceNumber: string;
};

const INVOICES: Invoice[] = [
  { id: "inv_1", price: "$900", status: "overdue", created: "01/17/2025", due: "02/17/2025", payment: "-", invoiceNumber: "SUB-D8EF5DE9-0001" },
  { id: "inv_2", price: "$900", status: "paid", created: "01/17/2025", due: "02/17/2025", payment: "-", invoiceNumber: "SUB-D8EF5DE9-0002" },
  { id: "inv_3", price: "$1900", status: "open", created: "01/17/2025", due: "02/17/2025", payment: "-", invoiceNumber: "SUB-D8EF5DE9-0003" },
];

function MethodIcon({ type }: { type: PaymentMethod["type"] }) {
  if (type === "bank") return <img src="/images/payments/bank.svg" alt="Bank" />;
  if (type === "visa") return <img src="/images/payments/visa.svg" alt="Visa" />;
  return <CreditCard className="w-6 h-4 text-[#5C5E63]" />;
}

function StatusPill({ status }: { status: "overdue" | "active" | "paid" | "open" | "primary" }) {
  const toneClass =
    status === "overdue"
      ? "bg-backgroundHover text-drakGrey"
      : status === "active" || status === "paid" || status === "primary"
        ? "bg-[#E7F8E1] text-[#247E00]"
          : status === "open"
            ? "bg-[#D7E9FF] text-main"
        : "bg-[#F4F5F6] text-[#5C5E63]";
  return <Badge className={`border-transparent px-1 py-0 rounded-[4px] ${toneClass}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

export default function SettingsBillingPage() {
  const paymentMethods = React.useMemo(
    () => [...PAYMENT_METHODS].sort((a, b) => Number(!!b.primary) - Number(!!a.primary)),
    []
  );

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Topbar */}
      <div className="w-full border-b px-4 h-10 flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-sm text-grey font-medium">Billing</div>
        </div>
      </div>

      {/* Main */}
      <div className="w-full pt-2 flex flex-1 items-start justify-center overflow-y-auto">
        <div className="w-[812px] space-y-6">
          {/* Section header */}
          <div className="border-b border-elementStroke pb-4">
            <div className="text-sm text-black font-medium">Billing</div>
          </div>

          {/* Payment methods */}
          <div className="space-y-3">
            <div className="text-sm text-black font-medium">Payment methods</div>
            <div className="flex flex-col gap-1.5">
              {paymentMethods.map((m) => (
                <div key={m.id} className="w-full border border-elementStroke rounded-[6px] px-2 py-[9px] bg-white flex items-center gap-2">
                  <div className={cn("flex items-center justify-center rounded-[2px] w-6 h-4", m.type === "bank" ? "bg-[#6B7076]" : m.type === "visa" ? "bg-[#172B85]" : "bg-[#125AFF]")}>
                    <MethodIcon type={m.type} />
                  </div>
                  <div className="text-xs text-darkGrey font-normal">ending in {m.last4}</div>
                  <div className="ml-auto flex items-center gap-2">
                    {m.expires ? (
                      <div className="text-xs text-darkGrey font-normal">Expires {m.expires}</div>
                    ) : null}
                    {!m.primary && <div className="text-xs text-darkGrey font-normal">{m.currency}</div>}
                    {m.primary && (
                      <StatusPill status="primary" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="cursor-pointer">
                          <MoreHorizontal className="w-4 h-4 text-grey" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!m.primary && <DropdownMenuItem>Make primary</DropdownMenuItem>}
                        <DropdownMenuItem>Remove</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscriptions */}
          <div className="space-y-4">
            <div className="text-sm text-black font-medium">Subscriptions</div>
            <Table className="text-xs text-darkGrey font-normal">
              <TableHeader>
                <TableRow className="border-b border-elementStroke">
                  <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Price</TableHead>
                  <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Status</TableHead>
                  <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Created</TableHead>
                  <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Next payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SUBSCRIPTIONS.map((sub) => (
                  <TableRow key={sub.id} className="border-0">
                    <TableCell className="px-0 py-[9px]">{sub.price}</TableCell>
                    <TableCell className="px-0 py-[9px]">
                      <StatusPill
                        status={sub.status}
                      />
                    </TableCell>
                    <TableCell className="px-0 py-[9px]">{sub.created}</TableCell>
                    <TableCell className="px-0 py-[9px]">{sub.nextPayment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Invoices */}
          <div className="space-y-4">
            <div className="text-sm text-black font-medium">Invoices</div>
            <div className="rounded-[6px] bg-white">
              <Table className="text-xs text-darkGrey font-normal">
                <TableHeader>
                  <TableRow className="border-b border-elementStroke">
                    <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Price</TableHead>
                    <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Status</TableHead>
                    <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Created</TableHead>
                    <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Due</TableHead>
                    <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Payment</TableHead>
                    <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal">Invoice Number</TableHead>
                    <TableHead className="px-0 py-1 text-xs text-darkGrey font-normal"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INVOICES.map((invoice) => (
                    <TableRow key={invoice.id} className="border-0">
                      <TableCell className="px-0 py-2.5">{invoice.price}</TableCell>
                      <TableCell className="px-0 py-2.5">
                        <StatusPill
                          status={invoice.status}
                        />
                      </TableCell>
                      <TableCell className="px-0 py-2.5">{invoice.created}</TableCell>
                      <TableCell className="px-0 py-2.5">{invoice.due}</TableCell>
                      <TableCell className="px-0 py-2.5">{invoice.payment}</TableCell>
                      <TableCell className="px-0 py-2.5">{invoice.invoiceNumber}</TableCell>
                      <TableCell className="text-right px-0 py-2.5">
                        <div
                          className="inline-block px-2.5 py-1 text-xs text-white font-medium rounded-[5px] bg-main hover:bg-main/80 cursor-pointer"
                        >
                          Pay
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



