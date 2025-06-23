"use client";

import NextLink, { LinkProps } from "next/link";
import { forwardRef } from "react";
import NProgress from "nprogress";

function isModifiedEvent(event: React.MouseEvent): boolean {
  const eventTarget = event.currentTarget as HTMLAnchorElement | SVGAElement;
  const target = eventTarget.getAttribute("target");
  return (
    (target && target !== "_self") ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.nativeEvent && event.nativeEvent.button === 1)
  );
}

export const ProgressLink = forwardRef<HTMLAnchorElement, LinkProps & { children: React.ReactNode, className?: string }>(
  function ProgressLink({ href, onClick, children, className, ...rest }, ref) {
    const useLink = href && href.toString().startsWith("/");
    if (!useLink) {
      return <a href={href?.toString()} onClick={onClick} {...rest} className={className}>{children}</a>;
    }

    const shouldTriggerStartEvent = (href: string, clickEvent?: React.MouseEvent) => {
      const current = window.location;
      const target = new URL(href, location.href);

      if (clickEvent && isModifiedEvent(clickEvent)) return false;
      if (current.origin !== target.origin) return false;
      if (current.pathname === target.pathname && current.search === target.search) return false;

      return true;
    }

    return (
      <NextLink
        href={href}
        onClick={(event) => {
          if (shouldTriggerStartEvent(href.toString(), event)) {
            NProgress.start();
          }
          if (onClick) onClick(event);
        }}
        {...rest}
        ref={ref}
        className={className}
      >
        {children}
      </NextLink>
    );
  }
); 