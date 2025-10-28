"use client";
import BillingTabs from "@/components/checkout/billing-tabs";
import BusinessInformation from "@/components/checkout/bussiness-information";
import CouponValidator from "@/components/checkout/coupon-validator";
import EmailInput from "@/components/checkout/email-input";
import ReviewsCarousel from "@/components/checkout/reviews-carousel";
import { ServiceCardPlan } from "@/components/checkout/service-card";
import ServiceSection from "@/components/checkout/service-section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspaceStore, useUserStore } from "@/lib/store";
import { ServiceFolder, Workspace } from "@/lib/store/types";
import { UserButton } from "@clerk/nextjs";
import { Divider } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { WorkspaceStore } from "@/lib/store/workspace-store";
import { UserStore } from "@/lib/store/user-store";

export default function Checkout() {
  // TODO Ensure that If uses goes to login, they are redirected back to checkout
  const router = useRouter();
  const activeWorkspaceId = useWorkspaceStore((s: WorkspaceStore) => s.activeWorkspaceId);
  const user = useUserStore((s: UserStore) => s.user);
  const [serviceFolders, setServiceFolders] = React.useState<ServiceFolder[]>(
    []
  );
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(
    activeWorkspaceId
  );
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [selectedPlans, setSelectedPlans] = React.useState<
    Map<string, ServiceCardPlan>
  >(new Map());
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    setWorkspaceId(activeWorkspaceId);
  }, [activeWorkspaceId]);

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
          {user ? (
            <UserButton afterSignOutUrl="/checkout" />
          ) : (
            <>
              <p className="text-[#1C1D1F]">Already have an account?</p>
              <span
                className="text-[#4670F9] hover:cursor-pointer hover:underline"
                onClick={() => router.push("/signin?redirect_uri=checkout")}
              >
                Log in
              </span>
            </>
          )}
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[1440px] justify-between gap-7 xl:gap-14 px-20 pt-4 pb-20">
        {/* TODO: Make this responsive, not fixed w */}
        <div className="flex w-full max-w-[726px] flex-col">
          <h2 className="pb-6 text-[20px] font-medium text-[#1C1D1F]">
            1. Enter an email address for your Feedbird Account
          </h2>
          <EmailInput
            emailSetter={setEmail}
            email={email}
            setWorkspace={setWorkspaceId}
          />
          <ServiceSection
            workspaceId={workspaceId}
            serviceFolders={serviceFolders}
            selectedPlans={selectedPlans}
            setServiceFolders={setServiceFolders}
            setSelectedPlans={setSelectedPlans}
          />
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
          <BusinessInformation />
          <div className="relative w-full">
            <ReviewsCarousel autoSlide interval={4000} />
          </div>
        </div>
      </div>
    </main>
  );
}
