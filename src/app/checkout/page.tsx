"use client";
import BillingTabs from "@/components/checkout/BillingTabs";
import CouponValidator from "@/components/checkout/CouponValidator";
import EmailInput from "@/components/checkout/EmailInput";
import PaymentForm from "@/components/checkout/PaymentForm";
import ReviewsCarousel from "@/components/checkout/ReviewsCarousel";
import ServiceCard, {
  ServiceCardPlan,
} from "@/components/checkout/ServiceCard";
import {
  Accordion,
  AccordionContent,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { servicesApi } from "@/lib/api/api-service";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { ServiceFolder } from "@/lib/supabase/client";
import { Divider } from "@mui/material";
import { AccordionItem } from "@radix-ui/react-accordion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

export default function Checkout() {
  // TODO Ensure that If uses goes to login, they are redirected back to checkout
  const router = useRouter();
  const { activeWorkspaceId } = useFeedbirdStore();
  const [serviceFolders, setServiceFolders] = React.useState<ServiceFolder[]>(
    []
  );
  const [loading, setLoading] = React.useState(false);
  const [selectedPlans, setSelectedPlans] = React.useState<
    Map<string, ServiceCardPlan>
  >(new Map());
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    const fetchServiceFolders = async () => {
      setLoading(true);
      // TODO How to handle this if no workspace is active?
      try {
        const data = await servicesApi.fetchServiceFolders(
          activeWorkspaceId ?? "09a4b9f1-f1da-45e8-a4a2-59c2b7ea2335"
        );
        setServiceFolders(data);
      } catch (error) {
        toast.error("An error occurred while fetching service folders");
      } finally {
        setLoading(false);
      }
    };
    fetchServiceFolders();
  }, []);

  return (
    <main className="min-h-screen overflow-auto bg-[#F7F7F8]">
      <div className="mx-auto flex h-20 w-full max-w-[1440px] flex-row justify-between px-16">
        <div className="flex flex-row items-center gap-10 py-6">
          <Image
            src="/images/logo/logo(1).svg"
            alt="Feedbird_logo"
            width={140}
            height={22}
          />
          <span className="text-[20px] font-normal text-[#838488]">
            Checkout
          </span>
        </div>
        <div className="flex flex-row items-center gap-3 py-6 text-[14px] font-normal">
          <p className="text-[#1C1D1F]">Already have an account?</p>
          <span
            className="text-[#4670F9] hover:cursor-pointer hover:underline"
            onClick={() => router.push("/signin")}
          >
            Log in
          </span>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[1440px] justify-between gap-7 xl:gap-14 px-20 pt-4 pb-20">
        {/* TODO: Make this responsive, not fixed w */}
        <div className="flex w-full max-w-[726px] flex-col">
          <h2 className="pb-6 text-[20px] font-medium text-[#1C1D1F]">
            1. Enter an email address for your Feedbird Account
          </h2>
          <EmailInput emailSetter={setEmail} email={email} />
          <div className="mt-10">
            <h2 className="pb-3 text-[20px] font-medium text-[#1C1D1F]">
              2. Select services
            </h2>
            {loading && (
              <div className="flex h-full min-h-[400px] w-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
                <span className="ml-3 text-gray-600">Loading services...</span>
              </div>
            )}
            {!loading && serviceFolders.length === 0 && (
              <div className="flex h-full min-h-[400px] w-full items-center justify-center">
                <span className="text-gray-600">No services available</span>
              </div>
            )}
            {serviceFolders &&
              serviceFolders.map((folder, index) => (
                <div key={`service-folder-${index}`}>
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue={folder.name}
                  >
                    <AccordionItem value={folder.name}>
                      <AccordionTrigger className="h-12 cursor-pointer">
                        <h3 className="py-5 text-base font-medium text-[#1C1D1F]">
                          {folder.name}
                        </h3>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {folder.services?.map((service) => (
                            <ServiceCard
                              key={service.id}
                              service={service}
                              isActivated={selectedPlans.has(service.id)}
                              selector={setSelectedPlans}
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Divider className="pt-5" />
                </div>
              ))}
          </div>
          <div className="flex flex-col gap-6 pt-8">
            <h2 className="pb-3 text-[20px] font-medium text-[#1C1D1F]">
              2. Payment method
            </h2>
            <PaymentForm />
          </div>
        </div>
        <div className="flex w-full max-w-[400px] xl:max-w-[480px] flex-col">
          <div className="flex justify-between pb-4">
            <h2 className="text-[20px] font-medium text-[#1C1D1F]">
              Order summary
            </h2>
            <Image
              src="/images/checkout/30-day-back.svg"
              alt="30DayBack"
              width={127}
              height={36}
            />
          </div>
          <div className="flex flex-col gap-6 rounded-[8px] border-1 border-[#E2E2E4] bg-white px-6 pt-4 pb-6">
            <BillingTabs
              selectedPlans={selectedPlans}
              setSelectedPlans={setSelectedPlans}
              serviceFolders={serviceFolders}
            />
            <div className="flex flex-col gap-6">
              <div className="flex flex-col">
                <Divider className="h-[1px] bg-[#E2E2E4]" />
                <CouponValidator />
              </div>
              <div className="flex gap-2">
                <Checkbox className="h-5 w-5 rounded-[5.13px]" />
                <p className="text-[13px] font-normal text-[#1C1D1F]">
                  By purchasing, you agree to the <u>terms of service</u>,{" "}
                  <u>auto-renewal terms</u>, and accept our <u>refund policy</u>
                  .
                </p>
              </div>
              <Button
                variant="default"
                className="h-10 w-full rounded-[6px] bg-[#4670F9] py-[11px] text-[14px] font-medium text-white hover:cursor-pointer"
              >
                Complete purchase
              </Button>
            </div>
          </div>
          <div className="flex w-full flex-col gap-6 p-6">
            <div className="flex gap-2">
              <h3 className="bg-gradient-to-r from-[#2ED1F1] to-[#4670F9] bg-clip-text text-[20px] font-extrabold text-transparent">
                20,000+
              </h3>
              <span className="text-[20px] font-medium text-[#1C1D1F]">
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
                <span className="text-[16px] text-[#060A13]">
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
                <span className="text-[16px] text-[#060A13]">
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
                <span className="text-[16px] text-[#060A13]">
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
                <span className="text-[16px] text-[#060A13]">
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
                <span className="text-[16px] text-[#060A13]">
                  80% more affordable than alternatives
                </span>
              </div>
            </div>
          </div>
          <div className="relative w-full">
            <ReviewsCarousel autoSlide interval={4000} />
          </div>
        </div>
      </div>
    </main>
  );
}
