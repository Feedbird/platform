"use client";

import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUploader } from "@/hooks/use-image-uploader";
import { userApi } from "@/lib/api/api-service";
import { cn } from "@/lib/utils";
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useUser, useReverification } from "@clerk/nextjs";
import { toast } from "sonner";

export default function SettingsProfilePage() {
  const user = useFeedbirdStore((s) => s.user);
  const workspaceId = useFeedbirdStore((s) => s.activeWorkspaceId) as string;
  const { user: clerkUser } = useUser();

  const { upload, uploading } = useImageUploader({
    workspaceId,
    resource: [{ type: "users", id: user?.id || user?.email }],
  });
  const userAvatarInput = React.useRef<HTMLInputElement | null>(null);

  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(user?.imageUrl || undefined);
  const [firstName, setFirstName] = React.useState<string>(user?.firstName || "");
  const [lastName, setLastName] = React.useState<string>(user?.lastName || "");
  const [saving, setSaving] = React.useState(false);
  
  // Change email view state
  const [showChangeEmail, setShowChangeEmail] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState("");
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [savingEmail, setSavingEmail] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailVerificationId, setEmailVerificationId] = React.useState<string | null>(null);
  const [emailVerificationCode, setEmailVerificationCode] = React.useState<string>("");
  const [emailVerificationNotice, setEmailVerificationNotice] = React.useState<string>("");
  const [emailVerificationComplete, setEmailVerificationComplete] = React.useState(false);

  // Change password view state
  const [showChangePassword, setShowChangePassword] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmNewPassword, setConfirmNewPassword] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [passwordNotice, setPasswordNotice] = React.useState<string>("");

  const passwordEnabled = clerkUser?.passwordEnabled ?? false;

  const getInitials = (first?: string, last?: string) => {
    const f = (first || "").trim();
    const l = (last || "").trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f[0]!.toUpperCase();
    if (l) return l[0]!.toUpperCase();
    return "";
  };

  // Minimal change reverification wrapper for password update
  const updatePw = useReverification(async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    if (!clerkUser) throw new Error("No user");
    if (passwordEnabled) {
      await clerkUser.updatePassword({ newPassword, currentPassword });
    } else {
      // User signed up with a social provider and has no password; create one without current password
      // @ts-ignore - createPassword is available at runtime; types may vary by Clerk version
      await (clerkUser as any).createPassword?.({ password: newPassword })
        || (await clerkUser.updatePassword({ newPassword }));
    }
    return true;
  });

  // Reverification wrapper for setting primary email to a new address
  const setPrimaryEmail = useReverification(async ({ emailId }: { emailId: string }) => {
    if (!clerkUser) throw new Error("No user");
    await clerkUser.update({ primaryEmailAddressId: emailId });
    return true;
  });

  // Reverification wrapper for creating new email address
  const createEmailAddress = useReverification(async ({ email }: { email: string }) => {
    if (!clerkUser) throw new Error("No user");
    const emailAddress = await clerkUser.createEmailAddress({ email });
    return emailAddress;
  });

  async function handleUploadAvatar(file: File) {
    if (!workspaceId) return;
    const url = await upload(file);
    if (url) {
      setAvatarUrl(url);
    }
  }

  function handleRemoveAvatar() {
    setAvatarUrl(undefined);
  }

  function resetEmailChangeState() {
    setNewEmail("");
    setConfirmEmail("");
    setPassword("");
    setShowPassword(false);
    setEmailVerificationId(null);
    setEmailVerificationCode("");
    setEmailVerificationNotice("");
    setEmailVerificationComplete(false);
  }

  async function handleSave() {
    if (!user?.email) return;
    try {
      setSaving(true);
      const updates: any = {};
      if (firstName !== (user.firstName || "")) updates.first_name = firstName;
      if (lastName !== (user.lastName || "")) updates.last_name = lastName;
      
      const currentImage = user.imageUrl || undefined;
      if (avatarUrl !== currentImage) {
        // Only set image_url if avatarUrl has a value, otherwise set to null
        updates.image_url = avatarUrl || null;
      }
      
      console.log("avatarUrl:", avatarUrl);
      console.log("currentImage:", currentImage);
      console.log("updates:", updates);
      
      if (Object.keys(updates).length > 0) {
        await userApi.updateUser({ email: user.email }, updates);
        useFeedbirdStore.setState((s: any) => ({
          user: s.user
            ? {
                ...s.user,
                firstName: updates.first_name !== undefined ? firstName : s.user.firstName,
                lastName: updates.last_name !== undefined ? lastName : s.user.lastName,
                imageUrl: updates.image_url !== undefined ? (avatarUrl || null) : s.user.imageUrl,
              }
            : s.user,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEmail() {
    if (!user?.email || !newEmail || !confirmEmail) return;
    if (newEmail !== confirmEmail) return;
    if (!clerkUser) return;
    const oldEmail = user.email;
    console.log("old email:", oldEmail);
    console.log("new email:", newEmail);
    try {
      setSavingEmail(true);

      // First pass: create + prepare verification, then show code field and exit
      if (!emailVerificationId) {
        // Check if the email already exists in the user's email addresses
        const existingEmailAddress = clerkUser.emailAddresses?.find((e: any) => e.emailAddress === newEmail);
        
        let emailAddress;
        if (existingEmailAddress) {
          // Email already exists, use it
          emailAddress = existingEmailAddress;
          console.log("Using existing email address:", emailAddress);
        } else {
          // Email doesn't exist, create it
          emailAddress = await createEmailAddress({ email: newEmail });
          console.log("Created new email address:", emailAddress);
        }
        
        try {
          // Check if the email is already verified
          const isVerified = emailAddress.verification?.status === 'verified';
          
          if (isVerified) {
            // Email is already verified, skip verification and set as primary immediately
            console.log("Email is already verified, setting as primary immediately");
            const ok = await setPrimaryEmail({ emailId: emailAddress.id });
            if (ok) {
              try {
                const old = clerkUser.emailAddresses?.find((e: any) => e.emailAddress === user.email);
                if (old) await old.destroy();
              } catch {}
              await userApi.updateUser({ email: user.email }, { email: newEmail });
              useFeedbirdStore.setState((s: any) => ({ user: s.user ? { ...s.user, email: newEmail } : s.user }));
              setShowChangeEmail(false);
              setEmailVerificationComplete(false);
              setEmailVerificationId(null);
              toast.success("Email updated successfully");
            }
          } else {
            // Email is not verified, prepare verification
            await (emailAddress as any).prepareVerification?.({ strategy: 'email_code' });
            setEmailVerificationCode("");
            setEmailVerificationId(emailAddress.id);
            setEmailVerificationNotice("We sent a verification code to your new email. Enter it below to continue.");
          }
        } catch (prepErr) {
          console.warn('prepareVerification failed or not needed:', prepErr);
          // If no verification needed, proceed to set primary immediately
          const ok = await setPrimaryEmail({ emailId: emailAddress.id });
          if (ok) {
            try {
              const old = clerkUser.emailAddresses?.find((e: any) => e.emailAddress === user.email);
              if (old) await old.destroy();
            } catch {}
            await userApi.updateUser({ email: user.email }, { email: newEmail });
            useFeedbirdStore.setState((s: any) => ({ user: s.user ? { ...s.user, email: newEmail } : s.user }));
            setShowChangeEmail(false);
            setEmailVerificationComplete(false);
            setEmailVerificationId(null);
            toast.success("Email updated successfully");
          }
        }
        return;
      }

      // Second pass: verify code and then set as primary
      if (!emailVerificationCode) {
        setEmailVerificationNotice("Please enter the verification code sent to your new email.");
        return;
      }

      const toVerify = clerkUser.emailAddresses?.find((e: any) => e.id === emailVerificationId);
      if (!toVerify) {
        setEmailVerificationNotice("Verification session expired. Please try again.");
        setEmailVerificationId(null);
        return;
      }

      try {
        await (toVerify as any).attemptVerification?.({ code: emailVerificationCode });
        setEmailVerificationComplete(true);
        setEmailVerificationNotice("");
      } catch (err: any) {
        setEmailVerificationNotice(err?.errors?.[0]?.message || "Invalid verification code.");
        return;
      }

      // Find the old email BEFORE setting the new one as primary
      const oldEmailAddress = clerkUser.emailAddresses?.find((e: any) => e.emailAddress === user.email);
      console.log("old email to destroy:", oldEmailAddress);

      const ok = await setPrimaryEmail({ emailId: toVerify.id });
      if (!ok) return;

      // Now destroy the old email
      try {
        if (oldEmailAddress) {
          await oldEmailAddress.destroy();
          console.log("Old email destroyed successfully");
        }
      } catch (destroyErr: any) {
        // Check if it's a connected accounts error
        if (destroyErr?.errors?.[0]?.message?.includes("Connected Accounts")) {
          console.warn("Old email cannot be destroyed because it's linked to connected accounts (Google, Facebook, etc.). This is normal for social sign-ups.");
        } else {
          console.warn("Failed to destroy old email:", destroyErr);
        }
      }

      await userApi.updateUser({ email: oldEmail }, { email: newEmail });
      useFeedbirdStore.setState((s: any) => ({ user: s.user ? { ...s.user, email: newEmail } : s.user }));

      setShowChangeEmail(false);
      setEmailVerificationComplete(false);
      setEmailVerificationId(null);
      toast.success("Email updated successfully");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleSavePassword() {
    setPasswordNotice("");
    if (!newPassword || !confirmNewPassword || (passwordEnabled && !currentPassword)) {
      setPasswordNotice("Please fill in all required fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordNotice("New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordNotice("Password must be at least 8 characters long");
      return;
    }
    if (!clerkUser) {
      setPasswordNotice("Not signed in");
      return;
    }
    
    try {
      setSavingPassword(true);
      // Use Clerk reverification wrapper; will trigger modal if required and retry
      const ok = await updatePw({ currentPassword, newPassword });
      if (ok) {
        // Reset local state and exit view
        setNewPassword("");
        setConfirmNewPassword("");
        setCurrentPassword("");
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setShowCurrentPassword(false);
        setPasswordNotice("");
        setShowChangePassword(false);
        toast.success("Password updated successfully");
      }
    } catch (err: any) {
      console.error(err);
      setPasswordNotice(err?.errors?.[0]?.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  }

  function handleForgotPassword() {
    // TODO: Implement forgot password functionality
  }

  // Clear notice when toggling view or editing fields
  React.useEffect(() => {
    setPasswordNotice("");
  }, [showChangePassword, newPassword, confirmNewPassword, currentPassword]);

  if (showChangePassword) {
    return (
      <div className="flex flex-col w-full h-full gap-4">
        {/* Topbar */}
        <div className="w-full border-b px-4 h-10 flex items-center justify-between">
          <div className="text-sm text-grey font-medium">Change Password</div>
        </div>

        {/* Main area */}
        <div className="w-full pt-2 flex flex-1 items-start justify-center overflow-y-auto">
          <div className="w-[512px] space-y-6">
            {/* Heading */}
            <div className="border-b border-elementStroke pb-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="flex items-center justify-center w-4 h-4 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-grey" />
                </button>
                <div className="text-sm text-black font-medium">Change password</div>
              </div>
            </div>

            {/* Description */}
            <div className="text-sm text-grey font-normal">
              Your password must be at least{" "}
              <span className="text-black">8 characters long.{" "}</span>
              Avoid common words or patterns.
            </div>

            {/* Fields */}
            <div className="space-y-6">
              {/* New password */}
              <div className="space-y-2.5">
                <label htmlFor="newPassword" className="block text-sm font-normal text-grey">New password</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder=""
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-[4px] border border-strokeButton px-3 py-2 pr-10 text-sm text-black font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-3 flex items-center justify-center cursor-pointer"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4 text-grey" />
                    ) : (
                      <Eye className="w-4 h-4 text-grey" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div className="space-y-2.5">
                <label htmlFor="confirmNewPassword" className="block text sm font-normal text-grey">Confirm new password</label>
                <div className="relative">
                  <input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder=""
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full rounded-[4px] border border-strokeButton px-3 py-2 pr-10 text-sm text-black font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-3 flex items-center justify-center cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-grey" />
                    ) : (
                      <Eye className="w-4 h-4 text-grey" />
                    )}
                  </button>
                </div>
              </div>

              {/* Current password */}
              {passwordEnabled && (
              <div className="space-y-2.5">
                <label htmlFor="currentPassword" className="block text-sm font-normal text-grey">Current password</label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder=""
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-[4px] border border-strokeButton px-3 py-2 pr-10 text-sm text-black font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-3 flex items-center justify-center cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4 text-grey" />
                    ) : (
                      <Eye className="w-4 h-4 text-grey" />
                    )}
                  </button>
                </div>
                {/* Notice */}
                {passwordNotice && (
                  <div className="mt-2 text-xs text-[#D82A2A]">{passwordNotice}</div>
                )}
                {/* Forgot password */}
                <div>
                  <button
                    onClick={handleForgotPassword}
                    className="text-sm text-main font-medium cursor-pointer hover:text-main/80"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              )}

              {/* Save changes */}
              <div>
                <button
                  onClick={handleSavePassword}
                  className={cn("inline-flex items-center rounded-[5px] bg-main text-white text-sm font-medium px-3 py-1.5 hover:bg-main/80 cursor-pointer disabled:bg-main/80 disabled:cursor-default")}
                  disabled={savingPassword || !newPassword || !confirmNewPassword || (passwordEnabled && !currentPassword)}
                >
                  {savingPassword ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showChangeEmail) {
    return (
      <div className="flex flex-col w-full h-full gap-4">
        {/* Topbar */}
        <div className="w-full border-b px-4 h-10 flex items-center justify-between">
          <div className="text-sm text-grey font-medium">Change Email</div>
        </div>

        {/* Main area */}
        <div className="w-full pt-2 flex flex-1 items-start justify-center overflow-y-auto">
          <div className="w-[512px] space-y-6">
            {/* Heading */}
            <div className="border-b border-elementStroke pb-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowChangeEmail(false)}
                  className="flex items-center justify-center w-4 h-4 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-grey" />
                </button>
                <div className="text-sm text-black font-medium">Change email</div>
              </div>
            </div>

            {/* Description */}
            <div className="text-sm text-grey font-normal">
              Update the email you use for your Feedbird account. Your email is currently{" "}
              <span className="text-black">{user?.email}</span>.
            </div>

            {/* Fields */}
            <div className="space-y-6">
              {/* New email */}
              <div className="space-y-2.5">
                <label htmlFor="newEmail" className="block text-sm font-normal text-grey">New email</label>
                <input
                  id="newEmail"
                  name="newEmail"
                  type="email"
                  placeholder=""
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-[4px] border border-strokeButton px-3 py-2 text-sm text-black font-normal"
                />
              </div>

              {/* Confirm new email */}
              <div className="space-y-2.5">
                <label htmlFor="confirmEmail" className="block text-sm font-normal text-grey">Confirm new email</label>
                <input
                  id="confirmEmail"
                  name="confirmEmail"
                  type="email"
                  placeholder=""
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className="w-full rounded-[4px] border border-strokeButton px-3 py-2 text-sm text-black font-normal"
                />
              </div>

              {/* Password */}
              <div className="space-y-2.5">
                <label htmlFor="password" className="block text-sm font-normal text-grey">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-[4px] border border-strokeButton px-3 py-2 pr-10 text-sm text-black font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center justify-center cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-grey" />
                    ) : (
                      <Eye className="w-4 h-4 text-grey" />
                    )}
                  </button>
                </div>
              </div>

              {/* Verification code (shown after code is sent) */}
              {emailVerificationId && !emailVerificationComplete && (
                <div className="space-y-2.5">
                  <label htmlFor="emailCode" className="block text-sm font-normal text-grey">Verification code</label>
                  <input
                    id="emailCode"
                    name="emailCode"
                    type="text"
                    placeholder="Enter the code sent to your new email"
                    value={emailVerificationCode}
                    onChange={(e) => setEmailVerificationCode(e.target.value)}
                    className="w-full rounded-[4px] border border-strokeButton px-3 py-2 text-sm text-black font-normal"
                  />
                  {emailVerificationNotice && (
                    <div className="text-xs text-[#D82A2A]">{emailVerificationNotice}</div>
                  )}
                </div>
              )}

              {/* Forgot password */}
              <div>
                <button
                  onClick={handleForgotPassword}
                  className="text-sm text-main font-medium cursor-pointer hover:text-main/80"
                >
                  Forgot password?
                </button>
              </div>

              {/* Save changes */}
              <div>
                <button
                  onClick={handleSaveEmail}
                  className={cn("inline-flex items-center rounded-[5px] bg-main text-white text-sm font-medium px-3 py-1.5 hover:bg-main/80 cursor-pointer", savingEmail && "opacity-60 cursor-default")}
                  disabled={savingEmail || !newEmail || !confirmEmail || (emailVerificationId ? !emailVerificationCode : false)}
                >
                  {emailVerificationId ? (savingEmail ? "Verifying..." : "Verify") : (savingEmail ? "Saving..." : "Save changes")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Topbar */}
      <div className="w-full border-b px-4 h-10 flex items-center justify-between">
        <div className="text-sm text-grey font-medium">Profile</div>
      </div>

      {/* Main area */}
      <div className="w-full pt-2 flex flex-1 items-start justify-center overflow-y-auto">
        <div className="w-[512px] space-y-6">
          {/* Heading */}
          <div className="border-b border-elementStroke pb-4">
            <div className="text-sm text-black font-medium">Profile</div>
          </div>

          {/* Avatar section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <Avatar className="h-13 w-13">
                <AvatarImage src={avatarUrl || undefined} alt={user?.firstName || user?.email || "User"} className="object-cover" />
                <AvatarFallback className="text-base font-medium">
                  {getInitials(user?.firstName, user?.lastName) || (user?.email ? user.email.charAt(0).toUpperCase() : "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 items-center justify-center">
                <div className="text-base font-medium text-black">Profile Avatar</div>
                <div className="text-xs font-normal text-grey mt-1">Min. 200×200px, PNG or JPG</div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div
                onClick={avatarUrl ? handleRemoveAvatar : undefined}
                className={cn(
                  'text-sm text-[#D82A2A] font-medium cursor-pointer',
                  !!avatarUrl ? 'opacity-100' : 'opacity-30'
                )}
              >
                Remove photo
              </div>

              
              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  ref={userAvatarInput}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadAvatar(f);
                  }}
                />
                <Button onClick={() => userAvatarInput.current?.click()} size="sm" asChild={false} disabled={uploading} className="px-3 py-1.5 text-sm text-black font-semibold rounded-sm bg-backgroundHover hover:bg-backgroundHover/70 cursor-pointer">
                  <span className="items-center">{uploading ? "Uploading..." : "Upload"}</span>
                </Button>
              </label>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-6">
            {/* First/Last name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2.5">
                <label htmlFor="firstName" className="block text-sm font-normal text-grey">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-[4px] border border-strokeButton px-3 py-2 text-sm text-black font-normal"
                />
              </div>
              <div className="space-y-2.5">
                <label htmlFor="lastName" className="block text-sm font-normal text-grey">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-[4px] border border-strokeButton px-3 py-2 text-sm text-black font-normal"
                />
              </div>
            </div>
            
            {/* Email with Change button inside input */}
            <div className="space-y-2.5">
              <label htmlFor="email" className="block text-sm font-normal text-grey">Email</label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-[4px] border border-strokeButton pl-3 pr-32 py-2 text-sm text-black font-normal"
                />
                <button
                  type="button"
                  onClick={() => {
                    resetEmailChangeState();
                    setShowChangeEmail(true);
                  }}
                  className="absolute inset-y-0 right-3 text-main text-sm font-medium cursor-pointer"
                >
                  Change email
                </button>
              </div>
            </div>

            {/* Password with Change button inside input */}
            <div className="space-y-2.5">
              <label htmlFor="password" className="block text-sm font-normal text-grey">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={""}
                  disabled
                  className="w-full rounded-[4px] border border-strokeButton pl-3 pr-36 py-2 text-sm text-black font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  className="absolute inset-y-0 right-3 text-main text-sm font-medium cursor-pointer"
                >
                  Change password
                </button>
              </div>
            </div>

            {/* Save changes */}
            <div>
              <button
                onClick={handleSave}
                className={cn("inline-flex items-center rounded-[5px] bg-main text-white text-sm font-medium px-3 py-1.5 hover:bg-main/80 cursor-pointer", saving && "opacity-60 cursor-default")}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          {/* Delete account */}
          <section className="pt-8">
            <div className="text-sm font-medium text-black mb-1">Delete account</div>
            <div className="text-sm text-grey font-normal max-w-[380px] mb-3">
              Deleting your account is permanent. You will immediately lose access to all your data.
            </div>
            <Button
              variant="outline"
              className="text-sm text-[#D82A2A] hover:text-[#D82A2A] px-3 py-1.5 font-medium border-strokeButton rounded-[5px] cursor-pointer"
            >
              Delete account
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}