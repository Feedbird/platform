import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn, getFullnameinitial } from "@/lib/utils";
import * as React from "react";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { inviteApi, workspaceHelperApi } from "@/lib/api/api-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface InviteMembersModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteMembersModal({ open, onClose }: InviteMembersModalProps) {
  const user = useFeedbirdStore((s) => s.user);
  const activeWorkspaceId = useFeedbirdStore((s) => s.activeWorkspaceId);

  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [members, setMembers] = React.useState<{ email: string; first_name?: string; image_url?: string; role?: 'admin' | 'client' | 'team'; accept?: boolean }[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [updatingEmail, setUpdatingEmail] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<"Client" | "Team">("Client");

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setSubmitting(false);
    }
  }, [open]);

  // Load current workspace members
  React.useEffect(() => {
    const loadMembers = async () => {
      if (!open || !activeWorkspaceId) return;
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
  }, [open, activeWorkspaceId]);

  /* -----------------------------
   *  Submit
   * ---------------------------*/
  const handleSend = async () => {
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
        actorId: user?.id, // Pass current user ID for activity logging
        first_name: user?.firstName,
      };
      const response = role === 'Team'
        ? await inviteApi.inviteTeam(payload)
        : await inviteApi.inviteClient(payload);

      // Handle different response types
      if (response.warning) {
        toast.warning(response.message, {
          description: response.details,
          duration: 5000
        });
      } else if (response.message === 'Invitation already exists') {
        toast.info(response.message, {
          description: response.details,
          duration: 5000
        });
      } else {
        toast.success(response.message, {
          description: response.details,
          duration: 3000
        });
      }

      onClose();
      // Refresh members list after inviting
      try {
        if (activeWorkspaceId) {
          const res = await workspaceHelperApi.getWorkspaceMembers(activeWorkspaceId);
          setMembers(res.users || []);
        }
      } catch { }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to send invite");
    } finally {
      setSubmitting(false);
    }
  };

  /* -----------------------------
   *  Render
   * ---------------------------*/
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg px-0 pt-4 pb-0 gap-0">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-black px-4">Workspace members</DialogTitle>
        </DialogHeader>
    
        {/* Email input */}
        <div className="space-y-2 mt-4 px-4">
          <Input
            id="invite-email"
            placeholder="Emails, comma separated"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoFocus
            endSelect={{ value: role, onChange: setRole, options: ["Client", "Team"] }}
            endButton={{ onClick: handleSend, label: "Invite", disabled: submitting || !email.trim() }}
          />
        </div>

        {/* Current workspace members */}
        <div className="mt-2 px-4 pb-2">
          <div className="border-b border-elementStroke py-2">
            <div className="text-xs font-normal text-darkGrey">Members</div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {loadingMembers && (
              <p className="text-xs font-normal text-darkGrey py-1.5">Loading members...</p>
            )}
            {!loadingMembers && members.length === 0 && (
              <p className="text-xs font-normal text-darkGrey py-1.5">No members yet.</p>
            )}
            {!loadingMembers && [...members].sort((a, b) => {
              const sa = a.accept === false ? 1 : 0
              const sb = b.accept === false ? 1 : 0
              return sa - sb
            }).map((m) => (
              <div key={m.email} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    <AvatarImage src={m.image_url || undefined} alt={m.first_name || m.email} />
                    <AvatarFallback className="text-xs font-medium text-black">{getFullnameinitial(m?.first_name || undefined, undefined, m?.email || undefined)}</AvatarFallback>
                  </Avatar>
                  <div className="flex">
                    <span className="text-xs font-normal text-darkGrey leading-none">{m.first_name || m.email}{m.accept === false ? ' (Pending)' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center w-20 justify-between px-2">
                  <span className={cn("text-xs font-medium text-muted-foreground capitalize px-1 rounded-[4px]",
                    m.role === 'admin' ? 'bg-[#D7E9FF] text-main'
                      : m.role === 'client' ? 'bg-backgroundHover text-darkGrey' 
                        : m.role === 'team' ? 'bg-grey text-white' : '')}>
                    {m.role}
                  </span>
                  {m.role === 'admin' || m.accept === false ? null : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="cursor-pointer">
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                          <path d="M5 7L10 12L15 7" stroke="#75777C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="!min-w-[80px]" align="end">
                        {(['client', 'team'] as const).map((roleOpt) => (
                          <DropdownMenuItem
                            key={roleOpt}
                            onClick={async () => {
                              if (!activeWorkspaceId) return;
                              if (m.role === roleOpt) return;
                              try {
                                setUpdatingEmail(m.email);
                                await workspaceHelperApi.updateWorkspaceMemberRole(activeWorkspaceId, m.email, roleOpt);
                                setMembers((prev) => prev.map((u) => u.email === m.email ? { ...u, role: roleOpt } : u));
                                toast.success('Role updated');
                              } catch (e: any) {
                                toast.error(e?.message || 'Failed to update role');
                              } finally {
                                setUpdatingEmail(null);
                              }
                            }}
                            className={cn("cursor-pointer", 
                              roleOpt === m.role ? 'bg-accent' : undefined)}
                          >
                            <span className="text-sm font-medium text-black leading-none capitalize">{roleOpt}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex mt-2 py-2 px-4 bg-backgroundHover !justify-start">
          <Button variant="outline" className="cursor-pointer px-3 text-sm text-black font-medium py-1.5">
            <img src="/images/icons/link.svg" alt="copy"/>
            Copy link 
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
