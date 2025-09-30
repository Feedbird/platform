"use client";

import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useImageUploader } from "@/hooks/use-image-uploader";
import { userApi } from "@/lib/api/api-service";
import { cn } from "@/lib/utils";
import React from "react";
import { Button } from "@/components/ui/button";

export default function SettingsProfilePage() {
  const user = useFeedbirdStore((s) => s.user);
  const workspaceId = useFeedbirdStore((s) => s.activeWorkspaceId) as string;

  const { upload, uploading } = useImageUploader({
    workspaceId,
    resource: [{ type: "users", id: user?.id || user?.email }],
  });
  const userAvatarInput = React.useRef<HTMLInputElement | null>(null);

  const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(user?.imageUrl || undefined);
  const [firstName, setFirstName] = React.useState<string>(user?.firstName || "");
  const [lastName, setLastName] = React.useState<string>(user?.lastName || "");
  const [saving, setSaving] = React.useState(false);

  const getInitials = (first?: string, last?: string) => {
    const f = (first || "").trim();
    const l = (last || "").trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f[0]!.toUpperCase();
    if (l) return l[0]!.toUpperCase();
    return "";
  };

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

  async function handleSave() {
    if (!user?.email) return;
    try {
      setSaving(true);
      const updates: any = {};
      if (firstName !== (user.firstName || "")) updates.first_name = firstName;
      if (lastName !== (user.lastName || "")) updates.last_name = lastName;
      const currentImage = user.imageUrl || undefined;
      if (avatarUrl !== currentImage) updates.image_url = avatarUrl || "";

      if (Object.keys(updates).length > 0) {
        await userApi.updateUser({ email: user.email }, updates);
        useFeedbirdStore.setState((s: any) => ({
          user: s.user
            ? {
                ...s.user,
                firstName: updates.first_name !== undefined ? firstName : s.user.firstName,
                lastName: updates.last_name !== undefined ? lastName : s.user.lastName,
                imageUrl: updates.image_url !== undefined ? (avatarUrl || undefined) : s.user.imageUrl,
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

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Topbar */}
      <div className="w-full border-b px-4 h-10 flex items-center justify-between">
        <div className="text-sm text-grey font-medium">Profile</div>
      </div>

      {/* Main area */}
      <div className="w-full pt-2 flex flex-1 items-start justify-center overflow-y-auto">
        <div className="w-[520px] space-y-6">
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
                  disabled
                  className="w-full rounded-[4px] border border-strokeButton pl-3 pr-36 py-2 text-sm text-black font-normal"
                />
                <button
                  type="button"
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



