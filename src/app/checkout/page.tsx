"use client";
import PaymentForm from "@/components/checkout/PaymentForm";
import ReviewsCarousel from "@/components/checkout/ReviewsCarousel";
import ServiceCard, { mapPeriodicity } from "@/components/checkout/ServiceCard";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceFolder, ServicePlan } from "@/lib/supabase/client";
import { Divider } from "@mui/material";
import { AccordionItem } from "@radix-ui/react-accordion";
import { TabsContent } from "@radix-ui/react-tabs";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { set } from "nprogress";
import React from "react";
import { toast } from "sonner";

//! TODO Split into smaller components
export default function Checkout() {
  // TODO Ensure that If uses goes to login, they are redirected back to checkout
  const router = useRouter();
  const [serviceFolders, setServiceFolders] = React.useState<ServiceFolder[]>(
    []
  );
  const [loading, setLoading] = React.useState(false);
  const [selectedPlans, setSelectedPlans] = React.useState<
    Map<string, ServicePlan>
  >(new Map());
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    const fetchServiceFolders = async () => {
      setLoading(true);
      // TODO ENHANCE TO USE API structure
      try {
        const response = await fetch("/api/services/folders");
        if (!response.ok) {
          toast.error("Failed to fetch service folders");
          return;
        }
        const data = await response.json();
        setServiceFolders(data.data);
      } catch (error) {
        toast.error("An error occurred while fetching service folders");
      } finally {
        setLoading(false);
      }
    };
    fetchServiceFolders();
  }, []);

  React.useEffect(() => {
    let total = 0;
    selectedPlans.forEach((plan, serviceId) => {
      const service = serviceFolders
        .flatMap((folder) => folder.services || [])
        .find((s) => s.id === serviceId);

      if (service) {
        total += plan.price;
      }
    });
    setTotal(total);
  }, [selectedPlans.size]);

  console.log("Selected plans: ", selectedPlans);
  return (
    <main className="bg-[#F7F7F8] min-h-screen overflow-auto">
      <div className="w-full h-20 px-16 flex flex-row justify-between max-w-[1440px] mx-auto">
        <div className="flex flex-row gap-10 py-6 items-center">
          <Image
            src="/images/logo/logo(1).svg"
            alt="Feedbird_logo"
            width={140}
            height={22}
          />
          <span className="font-normal text-[#838488] text-[20px]">
            Checkout
          </span>
        </div>
        <div className="flex flex-row gap-3 py-6 font-normal text-[14px] items-center">
          <p className="text-[#1C1D1F]">Already have an account?</p>
          <span
            className="text-[#4670F9] hover:cursor-pointer hover:underline"
            onClick={() => router.push("/signin")}
          >
            Log in
          </span>
        </div>
      </div>
      <div className="w-full max-w-[1440px] mx-auto flex justify-between px-20 pt-4 gap-14 pb-20">
        {/* TODO: Make this responsive, not fixed w */}
        <div className="flex flex-col w-full max-w-[726px]">
          <h2 className="text-[20px] text-[#1C1D1F] font-medium pb-6">
            1. Enter an email address for your Feedbird Account
          </h2>
          <div className="rounded-[8px] w-full px-5 py-4 bg-white border-1 border-[#E2E2E4] flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <span className="font-medium text-[#1C1D1F] text-[13px]">
                  Your email address
                </span>
                <ChevronRight width={16} height={16} />
              </div>
              <Input
                className="rounded-[6px] h-[42px] border-1 border-[#C8C9CB] px-4 py-3 text-[#1C1D1F]"
                placeholder="name@example.com"
              />
            </div>
            <p className="text-[#1C1D1F] text-xs font-normal">
              You’ll be able to change notification settings for Nord services
              marketing emails in your Nord Account.
            </p>
          </div>
          <div className="mt-10">
            <h2 className="text-[20px] text-[#1C1D1F] font-medium pb-3">
              2. Select services
            </h2>
            {loading && (
              <div className="w-full h-full flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-3 text-gray-600">Loading services...</span>
              </div>
            )}
            {!loading && serviceFolders.length === 0 && (
              <div className="w-full h-full flex items-center justify-center min-h-[400px]">
                <span className="text-gray-600">No services available</span>
              </div>
            )}
            {serviceFolders &&
              serviceFolders.map((folder, index) => (
                <>
                  <Accordion
                    key={`service-folder-${index}`}
                    type="single"
                    collapsible
                  >
                    <AccordionItem value={folder.name}>
                      <AccordionTrigger className="h-12 cursor-pointer">
                        <h3 className="text-base text-[#1C1D1F] font-medium py-5">
                          {folder.name}
                        </h3>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-row flex-wrap gap-4">
                          {folder.services?.map((service) => (
                            <ServiceCard
                              key={service.id}
                              service={service}
                              selector={setSelectedPlans}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Divider className="pt-5" />
                </>
              ))}
          </div>
          <div className="pt-8 flex flex-col gap-6">
            <h2 className="text-[20px] text-[#1C1D1F] font-medium pb-3">
              2. Payment method
            </h2>
            <PaymentForm />
          </div>
        </div>
        <div className="flex flex-col w-full max-w-[480px]">
          <div className="flex justify-between pb-4">
            <h2 className="font-medium text-[#1C1D1F] text-[20px]">
              Order summary
            </h2>
            <Image
              src="/images/checkout/30-day-back.svg"
              alt="30DayBack"
              width={127}
              height={36}
            />
          </div>
          <div className="bg-white rounded-[8px] pt-4 pb-6 px-6 border-1 border-[#E2E2E4] flex flex-col gap-6">
            <Tabs className="w-full flex flex-col gap-6" defaultValue="monthly">
              <TabsList
                defaultChecked
                defaultValue={"monthly"}
                className="w-full h-11 rounded-[6px] bg-[#F4F5F6] p-1"
              >
                <TabsTrigger
                  value="monthly"
                  className="data-[state=active]:rounded-[6px] hover:cursor-pointer"
                >
                  Billed monthly
                </TabsTrigger>
                <TabsTrigger
                  value="yearly"
                  className="flex flex-row data-[state=active]:rounded-[6px] hover:cursor-pointer"
                >
                  <span>Billed yearly</span>
                  <div className="rounded-full bg-[#03985C] py-[2px] px-1.5 flex items-center justify-center text-white text-[10px] font-medium">
                    SAVE 10%
                  </div>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="monthly" className="flex flex-col gap-6">
                <div className="flex flex-col gap-6">
                  {selectedPlans.size > 0 &&
                    Array.from(selectedPlans.keys()).map((serviceId) => {
                      const plan = selectedPlans.get(serviceId);
                      const service = serviceFolders
                        .flatMap((folder) => folder.services || [])
                        .find((s) => s.id === serviceId);
                      if (!service || !plan) return null;
                      return (
                        <div
                          key={`${service.name}-${plan.id}`}
                          className="flex flex-col gap-2"
                        >
                          <h3 className="text-[#1C1D1F] font-medium text-base">
                            {service.name}
                          </h3>
                          <div className="flex flex-row justify-between text-sm">
                            <div className="flex flex-col font-normal">
                              <span className="text-[#1C1D1F]l">
                                {plan.quantity} {plan.qty_indicator}
                              </span>
                              <p className="text-[#838488]">Facebook</p>
                            </div>
                            <span className="text-[#1C1D1F] font-medium text-sm">
                              USD ${plan.price}/{mapPeriodicity(plan.period)}
                            </span>
                          </div>
                          <span
                            className="text-[#5C5E63] font-normal text-xs underline cursor-pointer"
                            onClick={() => {
                              setSelectedPlans((prev) => {
                                const newMap = new Map(prev);
                                newMap.delete(service.id);
                                return newMap;
                              });
                            }}
                          >
                            Remove
                          </span>
                        </div>
                      );
                    })}
                </div>
                <div className="flex flex-col">
                  <Divider className="bg-[#E2E2E4] h-[1px]" />
                  <div className="flex justify-between pt-6 text-[#1C1D1F]">
                    <p className="text-[14px] font-medium">Total</p>
                    <span className="text-[18px] font-semibold">
                      USD ${total}/mo
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col">
                <Divider className="bg-[#E2E2E4] h-[1px]" />
                <p className="underline text-[#1C1D1F] font-normal text-[14px] hover:cursor-pointer pt-[16px]">
                  Got a coupon?
                </p>
              </div>
              <div className="flex gap-2">
                <Checkbox className="w-5 h-5 rounded-[5.13px]" />
                <p className="font-normal text-[#1C1D1F] text-[13px]">
                  By purchasing, you agree to the <u>terms of service</u>,{" "}
                  <u>auto-renewal terms</u>, and accept our <u>refund policy</u>
                  .
                </p>
              </div>
              <Button
                variant="default"
                className="w-full bg-[#4670F9] text-white font-medium text-[14px] py-[11px] h-10 rounded-[6px] hover:cursor-pointer"
              >
                Complete purchase
              </Button>
            </div>
          </div>
          <div className="w-full p-6 flex flex-col gap-6">
            <div className="flex gap-2">
              <h3 className="text-[20px] font-extrabold bg-gradient-to-r from-[#2ED1F1] to-[#4670F9] bg-clip-text text-transparent">
                20,000+
              </h3>
              <span className="text-[#1C1D1F] font-medium text-[20px]">
                businesses trust Feedbird.
              </span>
            </div>
            <Divider className="bg-[#EAE9E9] opacity-30" />
            <div className="flex flex-col gap-4">
              <div className="flex flex-row gap-2">
                <Image
                  src="/images/checkout/check.svg"
                  alt="check_icon"
                  width={20}
                  height={20}
                />
                <span className="text-[#060A13] text-[16px]">
                  Dedicated account manager
                </span>
              </div>
              <div className="flex flex-row gap-2">
                <Image
                  src="/images/checkout/check.svg"
                  alt="check_icon"
                  width={20}
                  height={20}
                />
                <span className="text-[#060A13] text-[16px]">
                  Onboarding & support calls
                </span>
              </div>
              <div className="flex flex-row gap-2">
                <Image
                  src="/images/checkout/check.svg"
                  alt="check_icon"
                  width={20}
                  height={20}
                />
                <span className="text-[#060A13] text-[16px]">
                  High-quality content
                </span>
              </div>
              <div className="flex flex-row gap-2">
                <Image
                  src="/images/checkout/check.svg"
                  alt="check_icon"
                  width={20}
                  height={20}
                />
                <span className="text-[#060A13] text-[16px]">
                  Made by real people - not AI
                </span>
              </div>
              <div className="flex flex-row gap-2">
                <Image
                  src="/images/checkout/check.svg"
                  alt="check_icon"
                  width={20}
                  height={20}
                />
                <span className="text-[#060A13] text-[16px]">
                  80% more affordable than alternatives
                </span>
              </div>
            </div>
          </div>
          <div className="w-full relative">
            <ReviewsCarousel autoSlide interval={4000} />
          </div>
        </div>
      </div>
    </main>
  );
}
