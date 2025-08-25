import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import * as React from "react";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { inviteApi } from "@/lib/api/api-service";

interface InviteMembersModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteMembersModal({ open, onClose }: InviteMembersModalProps) {
  const user = useFeedbirdStore((s) => s.user);
  const workspaces = useFeedbirdStore((s) => s.workspaces);

  const [email, setEmail] = React.useState("");
  const [selectedWorkspaces, setSelectedWorkspaces] = React.useState<Set<string>>(new Set());
  const [selectedBoards, setSelectedBoards] = React.useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setSelectedWorkspaces(new Set());
      setSelectedBoards(new Set());
      setSubmitting(false);
    }
  }, [open]);

  /* -----------------------------
   *  Selection helpers
   * ---------------------------*/
  const toggleWorkspace = (wsId: string) => {
    const newSet = new Set(selectedWorkspaces);
    if (newSet.has(wsId)) {
      newSet.delete(wsId);
      // also remove boards of workspace
      const ws = workspaces.find((w) => w.id === wsId);
      ws?.boards.forEach((b) => selectedBoards.delete(b.id));
    } else {
      newSet.add(wsId);
      // add all boards
      const ws = workspaces.find((w) => w.id === wsId);
      ws?.boards.forEach((b) => selectedBoards.add(b.id));
    }
    setSelectedWorkspaces(newSet);
    setSelectedBoards(new Set(selectedBoards));
  };

  const findWsIdForBoard = (id: string): string | undefined => {
    for (const ws of workspaces) {
      if (ws.boards.some(b => b.id === id)) return ws.id;
    }
    return undefined;
  };

  const toggleBoard = (board_id: string) => {
    // board disabled if its workspace selected
    const board = workspaces.flatMap((w) => w.boards).find((b) => b.id === board_id);
    if (!board) return;
    const wsId = findWsIdForBoard(board_id);
    if (wsId && selectedWorkspaces.has(wsId)) {
      return; // ignore when parent workspace selected
    }
    const newSet = new Set(selectedBoards);
    if (newSet.has(board_id)) newSet.delete(board_id);
    else newSet.add(board_id);
    setSelectedBoards(newSet);
  };

  /* -----------------------------
   *  Submit
   * ---------------------------*/
  const handleSend = async () => {
    if (!email.trim()) {
      toast.error("Please enter email");
      return;
    }

    if (selectedWorkspaces.size === 0 && selectedBoards.size === 0) {
      toast.error("Please select at least one workspace or board");
      return;
    }

    setSubmitting(true);
    try {
      const response = await inviteApi.inviteMembers({
        email: email.trim(),
        workspaceIds: Array.from(selectedWorkspaces),
        boardIds: Array.from(selectedBoards).filter((bid) => {
          // ensure its workspace not selected
          const board = workspaces.flatMap((w) => w.boards).find((b) => b.id === bid);
          if (!board) return false;
          const wsId = findWsIdForBoard(bid);
          return !selectedWorkspaces.has(wsId ?? '');
        }),
        actorId: user?.id, // Pass current user ID for activity logging
      });
      
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
        </DialogHeader>

        {/* Email input */}
        <div className="space-y-2 py-2">
          <label htmlFor="invite-email" className="text-sm font-medium">
            Gmail address
          </label>
          <Input
            id="invite-email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoFocus
          />
        </div>

        {/* Workspace & boards */}
        <div className="max-h-60 overflow-y-auto space-y-4 mt-4">
          {workspaces.map((ws) => {
            const wsChecked = selectedWorkspaces.has(ws.id);
            return (
              <div key={ws.id}>
                <div className="flex items-center gap-2">
                  <Checkbox checked={wsChecked} onCheckedChange={() => toggleWorkspace(ws.id)} />
                  <span className="font-semibold">{ws.name}</span>
                </div>
                <div className="pl-6 mt-1 space-y-1">
                  {ws.boards.map((b) => {
                    const boardDisabled = wsChecked;
                    const boardChecked = wsChecked || selectedBoards.has(b.id);
                    return (
                      <label key={b.id} className={`flex items-center gap-2 text-sm ${boardDisabled ? 'opacity-60' : ''}`}>
                        <Checkbox
                          checked={boardChecked}
                          disabled={boardDisabled}
                          onCheckedChange={() => toggleBoard(b.id)}
                        />
                        {b.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {workspaces.length === 0 && <p className="text-sm text-muted-foreground">No workspaces created yet.</p>}
        </div>

        <DialogFooter className="pt-6">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={submitting} className="text-white bg-main hover:bg-main/90">
            {submitting ? "Sending..." : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
