import { useRouter } from "next/navigation";
import React from "react";

export function useNavigationBlock(shouldBlock: boolean) {
  const router = useRouter();
  const [nextUrl, setNextUrl] = React.useState<string | null>(null);
  const [blockNavigation, setBlockNavigation] = React.useState(false);

  const tryNavigate = (url: string) => {
    if (shouldBlock) {
      setNextUrl(url);
      setBlockNavigation(true);
    } else {
      router.push(url);
    }
  };

  const confirmNavigation = () => {
    if (nextUrl) {
      router.push(nextUrl);
    }
    setNextUrl(null);
    setBlockNavigation(false);
  };

  const cancelNavigation = () => {
    setNextUrl(null);
    setBlockNavigation(false);
  };

  return { blockNavigation, tryNavigate, confirmNavigation, cancelNavigation };
}
