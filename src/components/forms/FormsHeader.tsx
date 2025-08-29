import { Suspense } from "react";
import { SidebarTrigger } from "../ui/sidebar";
import { Button } from "../ui/button";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function FormsHeader() {
  return (
    <Suspense fallback={<header className="h-12" />}>
      <FormsHeaderContent />
    </Suspense>
  );
}

// TODO This may be moved to a more internal location, perhaps inner layout, so It can have context of edit mode without more global state
function FormsHeaderContent() {
  const router = useRouter();
  return (
    <header
      className="relative
      h-[52px] flex justify-between w-full items-between border-b border-border-primary pl-4 pr-2.5 py-2.5 gap-4 bg-white
    "
    >
      <div className="flex flex-row gap-2 items-center">
        <SidebarTrigger className="cursor-pointer shrink-0" />
        <span className="font-semibold text-lg tracking-[-0.6px] truncate max-w-[200px] text-[#1C1D1F]">
          Forms
        </span>
      </div>
      <div className="flex flex-row gap-4">
        <div className="flex flex-row gap-2">
          {/* <Button
            className="border border-border-button border-[#D3D3D3] rounded-[6px] text-black px-[12px] py-[7px] gap-[4px] cursor-pointer text-sm font-medium"
            variant="ghost"
            1
            size="sm"
          >
            Share
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            className="border border-border-button rounded-[6px] bg-main text-white px-[12px] py-[7px] gap-[4px] cursor-pointer text-sm font-medium"
            onClick={() => router.push("/forms/new")}
          >
            + New Form
          </Button>
        </div>
        <UserButton afterSignOutUrl="/landing" />
      </div>
    </header>
  );
}
