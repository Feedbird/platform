"use client";
import * as React from "react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Trash2Icon, EditIcon, Copy, SquareArrowOutUpRight } from "lucide-react";
import { Post, useFeedbirdStore, Workspace } from "@/lib/store/use-feedbird-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PostContextMenuProps {
  selectedPosts: Post[];
  onEdit: (post: Post) => void;
  onDuplicate: (posts: Post[]) => void;
  onDelete: (posts: Post[]) => void;
  contextMenuPosition: { x: number; y: number };
}

export function PostContextMenu({
  selectedPosts,
  onEdit,
  onDuplicate,
  onDelete,
  contextMenuPosition,
}: PostContextMenuProps) {
  const canEditOrDup = selectedPosts.length === 1;
  const store = useFeedbirdStore();
  const [shareDialogOpen, setShareDialogOpen] = React.useState(false);
  const [targetBrandId, setTargetBrandId] = React.useState<string>("");

  // gather all brands for the share dialog
  const allBrands: { id: string; name: string }[] = React.useMemo(() => {
    const result: { id: string; name: string }[] = [];
    for (const w of store.workspaces) {
      for (const b of w.brands) {
        result.push({ id: b.id, name: b.name });
      }
    }
    return result;
  }, [store.workspaces]);

  function handleShare() {
    // open dialog
    setShareDialogOpen(true);
  }
  function doShare() {
    if (!targetBrandId) return;
    const ids = selectedPosts.map((p) => p.id);
    store.sharePostsToBrand(ids, targetBrandId);
    setShareDialogOpen(false);
  }

  return (
    <>
      <DropdownMenuContent
        className="p-1"
        align="start"
        style={{
          position: "fixed",
          left: contextMenuPosition.x,
          top: contextMenuPosition.y,
        }}
      >
        <DropdownMenuItem
          onClick={() => {
            if (canEditOrDup) onEdit(selectedPosts[0]);
          }}
          disabled={!canEditOrDup}
        >
          <EditIcon size={16} className="mr-1" />
          Edit
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            // duplicate all selected
            if (selectedPosts.length === 0) return;
            onDuplicate(selectedPosts);
          }}
        >
          <Copy size={16} className="mr-1" />
          Duplicate
        </DropdownMenuItem>

        {/* New "Share" item */}
        <DropdownMenuItem onClick={handleShare}>
          <SquareArrowOutUpRight size={16} className="mr-1" />
          Share
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-red-600"
          onClick={() => onDelete(selectedPosts)}
        >
          <Trash2Icon size={16} className="mr-1 text-red-600" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share {selectedPosts.length} posts</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Choose a brand:</Label>
            <select
              className="border rounded p-1 w-full"
              value={targetBrandId}
              onChange={(e) => setTargetBrandId(e.target.value)}
            >
              <option value="">Select brand</option>
              {allBrands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={doShare}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
