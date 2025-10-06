"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { inviteApi, workspaceHelperApi } from "@/lib/api/api-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn, getFullnameinitial } from "@/lib/utils";

export default function SettingsMembersPage() {
  const user = useFeedbirdStore((s) => s.user);
  const activeWorkspaceId = useFeedbirdStore((s) => s.activeWorkspaceId);

  const [email, setEmail] = React.useState("");
  const [roleSelect, setRoleSelect] = React.useState<"Client" | "Team">("Client");
  const [submitting, setSubmitting] = React.useState(false);

  const [members, setMembers] = React.useState<{
    email: string;
    first_name?: string;
    image_url?: string;
    role?: "admin" | "client" | "team";
    accept?: boolean;
  }[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [updatingEmail, setUpdatingEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadMembers = async () => {
      if (!activeWorkspaceId) return;
      setLoadingMembers(true);
      try {
        const res = await workspaceHelperApi.getWorkspaceMembers(activeWorkspaceId);
        setMembers(res.users || []);
      } catch (e) {
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };
    loadMembers();
  }, [activeWorkspaceId]);

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter email");
      return;
    }
    if (!activeWorkspaceId) {
      toast.error("No active workspace selected");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: email.trim(),
        workspaceId: activeWorkspaceId,
        actorId: user?.id,
        first_name: user?.firstName,
      };
      const response = roleSelect === "Team"
        ? await inviteApi.inviteTeam(payload)
        : await inviteApi.inviteClient(payload);

      if ((response as any).warning) {
        toast.warning(response.message, {
          description: (response as any).details,
          duration: 5000,
        });
      } else if (response.message === "Invitation already exists") {
        toast.info(response.message, {
          description: (response as any).details,
          duration: 5000,
        });
      } else {
        toast.success(response.message, {
          description: (response as any).details,
          duration: 3000,
        });
      }

      setEmail("");
      try {
        if (activeWorkspaceId) {
          const res = await workspaceHelperApi.getWorkspaceMembers(activeWorkspaceId);
          setMembers(res.users || []);
        }
      } catch {}
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to send invite");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Top bar */}
      <div className="w-full border-b px-4 h-10 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link href={`/${activeWorkspaceId || ''}`} className="flex items-center justify-center w-4 h-4 cursor-pointer">
            <ArrowLeft className="w-4 h-4 text-grey" />
          </Link>
          <div className="text-sm text-grey font-medium">Members</div>
        </div>
      </div>

      {/* Main content */}
      <div className="w-full pt-2 flex flex-1 items-start justify-center overflow-y-auto">
      <div className="w-[610px]">
        {/* Title and description */}
        <div className="mb-4">
          <div className="text-sm font-medium text-black">Members</div>
          <div className="text-sm text-grey font-normal mt-1">Manage who has access to this workspace</div>
        </div>

        {/* Invite input */}
        <div className="w-full pb-4 border-b border-elementStroke">
          <Input
            id="invite-email"
            placeholder="Emails, comma separated"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            endSelect={{ value: roleSelect, onChange: setRoleSelect, options: ["Client", "Team"] }}
            endButton={{ onClick: handleInvite, label: "Invite", disabled: submitting || !email.trim() }}
          />
        </div>

        {/* Members table */}
        <div className="mt-4 border border-elementStroke rounded-[4px] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_90px] bg-[#FBFBFB] border-b border-elementStroke">
            <div className="text-xs font-normal text-darkGrey px-3 py-1">Who has access</div>
            <div className="text-xs font-normal text-darkGrey border-l border-elementStroke px-3 py-1">Role</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-elementStroke">
            {loadingMembers && (
              <div className="px-3 py-2 text-xs text-darkGrey">Loading members...</div>
            )}
            {!loadingMembers && members.length === 0 && (
              <div className="px-3 py-2 text-xs text-darkGrey">No members yet.</div>
            )}
            {!loadingMembers && members.length > 0 && (
              [...members]
                .sort((a, b) => {
                  const sa = a.accept === false ? 1 : 0;
                  const sb = b.accept === false ? 1 : 0;
                  return sa - sb;
                })
                .map((m) => (
                  <div key={m.email} className="grid grid-cols-[1fr_90px] items-center">
                    {/* Who has access */}
                    <div className="flex items-center gap-2.5 min-w-0 px-3 py-1.5">
                      <Avatar className="size-6">
                        <AvatarImage src={m.image_url || undefined} alt={m.first_name || m.email} />
                        <AvatarFallback className="text-xs font-medium text-black">{getFullnameinitial(user?.firstName || undefined, user?.lastName || undefined, user?.email || undefined)}</AvatarFallback>
                      </Avatar>
                      <div className="truncate flex items-center">
                        <span className="text-xs font-normal text-darkGrey leading-none">
                          {m.first_name || m.email}
                        </span>
                        {m.accept === false && (
                          <span className="text-xs font-normal text-darkGrey ml-1">(Pending)</span>
                        )}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center justify-between h-full border-l border-elementStroke px-3 py-1.5">
                      <span
                        className={cn(
                          "text-xs font-medium capitalize px-1.5 py-0.5 rounded-[4px]",
                          m.role === "admin"
                            ? "bg-[#D7E9FF] text-main"
                            : m.role === "client"
                            ? "bg-backgroundHover text-darkGrey"
                            : m.role === "team"
                            ? "bg-grey text-white"
                            : "bg-backgroundHover text-darkGrey"
                        )}
                      >
                        {m.role}
                      </span>

                      {m.role === "admin" || m.accept === false ? null : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="cursor-pointer">
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M5 7L10 12L15 7" stroke="#75777C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="!min-w-[80px]" align="end">
                            {(["client", "team"] as const).map((roleOpt) => (
                              <DropdownMenuItem
                                key={roleOpt}
                                onClick={async () => {
                                  if (!activeWorkspaceId) return;
                                  if (m.role === roleOpt) return;
                                  try {
                                    setUpdatingEmail(m.email);
                                    await workspaceHelperApi.updateWorkspaceMemberRole(activeWorkspaceId, m.email, roleOpt);
                                    setMembers((prev) => prev.map((u) => (u.email === m.email ? { ...u, role: roleOpt } : u)));
                                    toast.success("Role updated");
                                  } catch (e: any) {
                                    toast.error(e?.message || "Failed to update role");
                                  } finally {
                                    setUpdatingEmail(null);
                                  }
                                }}
                                className={cn("cursor-pointer", roleOpt === m.role ? "bg-accent" : undefined)}
                              >
                                <span className="text-sm font-medium text-black leading-none capitalize">{roleOpt}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}



