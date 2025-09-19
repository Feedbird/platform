"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import LandingPage from "@/app/landing/page";
import { AuthenticatedLayout } from "./authenticated-layout";

const publicRoutes = [
  "/landing",
  "/signup",
  "/signin",
  "/verify-email",
  "/sso-callback",
];
const initialRoutes = ["/accept-invite", "/client-onboarding", "/checkout"];

export function PublicPageWrapper({ pathname }: { pathname: string }) {
  switch (pathname) {
    case "/signup":
      // Import the signup page dynamically to avoid circular imports
      const SignUpPage = require("@/app/signup/page").default;
      return <SignUpPage />;

    case "/signin":
      // Import the signin page dynamically to avoid circular imports
      const SignInPage = require("@/app/signin/page").default;
      return <SignInPage />;

    case "/verify-email":
      // Import the verify-email page dynamically to avoid circular imports
      const VerifyEmailPage = require("@/app/verify-email/page").default;
      return <VerifyEmailPage />;

    case "/sso-callback":
      // Import the sso-callback page dynamically to avoid circular imports
      const SSOCallbackPage = require("@/app/sso-callback/page").default;
      return <SSOCallbackPage />;

    case "/client-onboarding":
      const ClientOnboardingPage =
        require("@/app/client-onboarding/page").default;
      return <ClientOnboardingPage />;

    case "/accept-invite":
      const AcceptInvitePage = require("@/app/accept-invite/page").default;
      return <AcceptInvitePage />;

    case "/checkout":
      const CheckoutPage = require("@/app/checkout/page").default;
      return <CheckoutPage />;
    default:
      return <LandingPage />;
  }
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("AuthGuard state:", {
      isLoaded,
      isSignedIn,
      userId: user?.id,
      pathname,
    });

    if (isLoaded) {
      // If user is signed in and trying to access landing, signup, signin, verify-email, or sso-callback page, redirect to home
      if (isSignedIn && publicRoutes.includes(pathname)) {
        const matchedPublicRoute = publicRoutes.find(
          (route) => route === pathname
        );
        console.log(
          `AuthGuard: Redirecting signed-in user from ${matchedPublicRoute} to home`
        );
        router.replace("/");
        return;
      }
      // If user is not signed in and trying to access protected routes, redirect to landing
      else if (
        !isSignedIn &&
        ![...publicRoutes, ...initialRoutes].includes(pathname)
      ) {
        console.log("AuthGuard: Redirecting unsigned user to landing");
        router.replace("/landing");
        return;
      }
    }
  }, [isLoaded, isSignedIn, pathname, router, user]);

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not signed in, show appropriate page
  if (!isSignedIn) {
    console.log("AuthGuard: User not signed in, showing page for", pathname);
    return <PublicPageWrapper pathname={pathname} />;
  }

  // If user is signed in, show the main app with authenticated layout
  // Only render authenticated layout if we have a user object and are on a protected route
  if (
    isSignedIn &&
    user &&
    ![...publicRoutes, "/client-onboarding"].includes(pathname)
  ) {
    console.log("AuthGuard: User signed in, showing authenticated layout");
    return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
  }

  // If user is signed in and on client-onboarding, render onboarding directly (no app layout)
  if (isSignedIn && pathname === "/client-onboarding") {
    const ClientOnboardingPage =
      require("@/app/client-onboarding/page").default;
    return <ClientOnboardingPage />;
  }

  // If user is signed in and on sso-callback, render sso-callback directly (no app layout)
  if (isSignedIn && pathname === "/sso-callback") {
    const SSOCallbackPage = require("@/app/sso-callback/page").default;
    return <SSOCallbackPage />;
  }

  // If user is signed in but we're on landing, signup, signin, verify-email, or sso-callback page, show loading until redirect completes
  if (isSignedIn && publicRoutes.includes(pathname)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Fallback - should not reach here
  console.log("AuthGuard: Fallback case");
  return <LandingPage />;
}
