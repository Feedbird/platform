"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Post, BoardGroupData, BoardRules, GroupComment } from "@/lib/store";
import { useSidebar } from "@/components/ui/sidebar";
import { useUserStore } from "@/lib/store";
import { StatusChip } from "@/components/content/shared/content-post-ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FinalGroup, getPassedRevisionRound } from "./utils";
import { Row, Table } from "@tanstack/react-table";

interface GroupDividerProps {
  children: React.ReactNode;
  rowCount?: number;
  groupPosts?: Post[];
  groupData?: BoardGroupData;
  boardRules?: BoardRules;
  isGroupedByMonth?: boolean;
  onOpenGroupFeedback?: (groupData: BoardGroupData, month: number) => void;
  month: number;
  isExpanded: boolean;
  groupKey: string;
  table: Table<Post>; // Table instance from react-table
  stickyStyles: (colId: string, zIndex?: number) => React.CSSProperties | undefined;
  grouping: string[];
  getFinalGroupRows: (rows: Row<Post>[], expanded: Record<string, boolean>, rowComparator?: (a: Row<Post>, b: Row<Post>) => number) => FinalGroup[];
  rowComparator?: (a: Row<Post>, b: Row<Post>) => number;
}

export function GroupDivider({
  children,
  rowCount,
  groupPosts,
  groupData,
  boardRules,
  isGroupedByMonth,
  onOpenGroupFeedback,
  month,
  isExpanded,
  groupKey,
  table,
  stickyStyles,
  grouping,
  getFinalGroupRows,
  rowComparator,
}: GroupDividerProps) {
  const visibleLeafColumns = table.getVisibleLeafColumns();
  const { state } = useSidebar();

  // Calculate available width based on sidebar state
  const sidebarWidth = state === "expanded" ? 256 : 56; // 16rem = 256px, 3.5rem = 56px
  const availableWidth =
    typeof window !== "undefined" ? window.innerWidth - sidebarWidth : 1200; // fallback width

  // Calculate approval status and deadline information
  const approvalInfo = React.useMemo(() => {
    if (!groupPosts || groupPosts.length === 0) return null;
    // Check if all posts are approved
    const allApproved = groupPosts.every(
      (post) =>
        post.status === "Approved" ||
        post.status === "Published" ||
        post.status === "Scheduled"
    );
    if (allApproved) {
      // Find the latest approval date (most recent updatedAt among approved posts)
      const latestApprovalDate = groupPosts
        .filter((post) => post.status === "Approved" && post.updatedAt)
        .reduce((latest, post) => {
          const postDate =
            post.updatedAt instanceof Date
              ? post.updatedAt
              : new Date(post.updatedAt!);
          return postDate > latest ? postDate : latest;
        }, new Date(0));

      return {
        type: "approved" as const,
        date: latestApprovalDate,
      };
    }
    // Check if approval deadline is enabled in board rules
    if (boardRules?.approvalDeadline && boardRules?.approvalDays) {
      // Find the latest updatedAt time among all posts in the group
      let latestUpdatedAt = groupPosts
        .filter((post) => post.updatedAt)
        .reduce((latest, post) => {
          const postDate =
            post.updatedAt instanceof Date
              ? post.updatedAt
              : new Date(post.updatedAt!);
          return postDate > latest ? postDate : latest;
        }, new Date(0));
      if (latestUpdatedAt.getTime() == 0) latestUpdatedAt = new Date();
      // Calculate days left
      const now = new Date();
      const deadlineDate = new Date(
        latestUpdatedAt.getTime() +
          boardRules.approvalDays * 24 * 60 * 60 * 1000
      );
      const daysLeft = Math.ceil(
        (deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (daysLeft > 0) {
        return {
          type: "deadline" as const,
          daysLeft,
        };
      }
    }

    return null;
  }, [groupPosts, boardRules]);

  // Cursor-following tooltip state for the entire group divider row
  const [isHoveringDivider, setIsHoveringDivider] = React.useState(false);
  const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const recordCountForTooltip =
    typeof rowCount === "number" ? rowCount : groupPosts?.length ?? 0;

  return (
    <>
      <tr
        onMouseEnter={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest(".no-divider-tooltip")) {
            setIsHoveringDivider(true);
          }
        }}
        onMouseMove={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".no-divider-tooltip")) {
            if (isHoveringDivider) setIsHoveringDivider(false);
            return;
          }
          setCursorPos({ x: e.clientX, y: e.clientY });
          if (!isHoveringDivider) setIsHoveringDivider(true);
        }}
        onMouseLeave={() => setIsHoveringDivider(false)}
        onDragOver={(e) => {
          // Prevent dropping on group headers when group is collapsed
          if (!isExpanded) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "none";
            return;
          }

          // Prevent dropping on group headers when dragging from different group
          if (grouping.length > 0) {
            const groups = getFinalGroupRows(
              table.getGroupedRowModel().rows,
              {},
              rowComparator
            );
            const allLeafRows = groups.flatMap((group: FinalGroup) => group.leafRows);

            // Get the source row from drag data
            const fromIndex = parseInt(
              e.dataTransfer.getData("text/plain"),
              10
            );
            if (!Number.isNaN(fromIndex)) {
              const sourceRow = allLeafRows[fromIndex];

              if (sourceRow) {
                // Find source group
                const sourceGroup = groups.find((group: FinalGroup) =>
                  group.leafRows.some((r: Row<Post>) => r.id === sourceRow.id)
                );

                // Check if source group is different from current group
                const currentGroup = groups.find(
                  (g: FinalGroup) => g.groupValues.month === month
                );
                if (
                  sourceGroup &&
                  currentGroup &&
                  sourceGroup !== currentGroup
                ) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "none";
                  return;
                }
              }
            }
          }
        }}
      >
        {/* ◀ left phantom sticky */}
        <td
          style={{
            position: "sticky",
            left: 0,
            width: 20,
            background: "#F8F8F8",
          }}
        />

        <td
          className="bg-white border-t border-l border-b border-[#E6E4E2]"
          colSpan={5}
          style={{
            borderRadius: "4px 0px 0px 0px",
            ...(stickyStyles("drag", 0) || {}), // Lower than cell zIndex to avoid covering borders
          }}
        >
          <div className="no-divider-tooltip inline-flex items-center gap-2 px-[12px] py-[10px] font-medium text-sm">
            {children}
            {isGroupedByMonth && groupPosts && groupPosts.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="no-divider-tooltip flex items-center">
                  <StatusChip
                    status={
                      groupPosts.every((post) => post.status === "Approved")
                        ? "Approved"
                        : "Pending Approval"
                    }
                    widthFull={false}
                  />
                </div>
                {/* Revision Rules Display / Progress */}
                {boardRules?.revisionRules && boardRules.firstMonth && (
                  <>
                    {boardRules.firstMonth === -1 ? (
                      <div className="px-2 py-[2px] bg-White flex justify-center items-center gap-1 overflow-hidde">
                        <img
                          src="/images/boards/unlimited.svg"
                          alt="Unlimited Revisions"
                          className="w-4 h-4"
                        />
                        <span className="text-xs font-medium">
                          Unlimited Revisions
                        </span>
                      </div>
                    ) : boardRules.firstMonth > 0 ? (
                      <div className="px-1.5 py-[2px] bg-White flex justify-center items-center gap-1 rounded-[4px] border border-1 border-elementStroke overflow-hidde">
                        {(() => {
                          const total = boardRules.firstMonth;
                          const passed = getPassedRevisionRound(groupKey, boardRules);
                          const size = 12;
                          const stroke = 1.3;
                          const radius = (size - stroke) / 2;
                          const circumference = 2 * Math.PI * radius;
                          const progress = total > 0 ? Math.min(1, passed / total) : 0;
                          const remaining = 1 - progress;
                          const dash = circumference * remaining;
                          return (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-default">
                                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                                    <circle
                                      cx={size / 2}
                                      cy={size / 2}
                                      r={radius}
                                      fill="none"
                                      stroke="#4670F9"
                                      strokeWidth={stroke}
                                      strokeDasharray={`${dash} ${circumference - dash}`}
                                      strokeDashoffset={dash}
                                      strokeLinecap="round"
                                      transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                    />
                                  </svg>
                                  <span className="text-xs font-medium text-black">
                                    {passed}/{total}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={8} className="bg-[#151515] text-white border-none text-xs">
                                Revision rounds
                              </TooltipContent>
                            </Tooltip>
                          );
                        })()}
                      </div>
                    ) : null}
                  </>
                )}

                {/* Right action area moved to right scrollable cell */}
              </div>
            )}
          </div>
        </td>

        <td
          colSpan={visibleLeafColumns.length - 6}
          className="bg-white border-t border-b border-[#E6E4E2]"
          style={{
            borderRadius: "0px 0px 0px 0px",
          }}
        />

        {/* ▶ right sticky actions cell */}
        <td
          className="no-divider-tooltip bg-white border-t border-b border-r border-[#E6E4E2]"
          style={{
            position: "sticky",
            right: 0,
            zIndex: 10,
            background: "white",
            borderTopRightRadius: 4,
          }}
        >
          <div className="flex items-center justify-end gap-2 px-2 py-[10px] whitespace-nowrap overflow-visible">
            {isGroupedByMonth && approvalInfo && (
              <>
                <div className="flex items-center">
                  {approvalInfo.type === "approved" ? (
                    <div className="px-2 py-[2px] bg-White rounded border-1 outline outline-1 outline-offset-[-1px] outline-emerald-100 flex justify-center items-center gap-1 overflow-x-auto whitespace-nowrap">
                      <img
                        src="/images/publish/check-circle.svg"
                        alt="approved"
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-xs font-semibold leading-none">
                        {approvalInfo.date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-xs text-emerald-600 font-medium truncate">
                        APPROVED
                      </span>
                    </div>
                  ) : approvalInfo.type === "deadline" ? (
                    <div className="px-2 py-[2px] bg-White rounded border-1 outline outline-1 outline-offset-[-1px] outline-orange-100 flex justify-center items-center gap-1 overflow-x-auto whitespace-nowrap">
                      <img
                        src="/images/publish/clock-fast-forward.svg"
                        alt="deadline"
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <span className="text-xs font-medium text-black truncate">
                        {approvalInfo.daysLeft} days left to review
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Group Comments Button */}
                {(() => {
                  const groupComments: GroupComment[] =
                    groupData?.comments || [];
                  let unreadedCount = 0;
                  let totalCount = 0;
                  let latestUnreaded: GroupComment | null = null;

                  totalCount = groupComments.length;
                  const email = useUserStore.getState().user?.email;
                  const unreaded = groupComments.filter(
                    (c: GroupComment) =>
                      !c.resolved &&
                      (!email || !(c.readBy || []).includes(email))
                  );
                  unreadedCount = unreaded.length;
                  if (unreadedCount > 0) {
                    latestUnreaded = unreaded.sort(
                      (a: GroupComment, b: GroupComment) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    )[0];
                  }

                  function timeAgo(date: Date | string) {
                    const now = new Date();
                    const d =
                      typeof date === "string" ? new Date(date) : date;
                    const diff = Math.floor(
                      (now.getTime() - d.getTime()) / 1000
                    );
                    if (diff < 60) return `${diff}s ago`;
                    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                    if (diff < 86400)
                      return `${Math.floor(diff / 3600)}h ago`;
                    return `${Math.floor(diff / 86400)}d ago`;
                  }

                  if (unreadedCount > 0 && latestUnreaded) {
                    return (
                      <div
                        className="flex items-center gap-1 pl-1 pr-1 py-[2px] bg-white rounded border-1 outline outline-1 outline-offset-[-1px] outline-main flex-shrink-0 cursor-pointer"
                        onClick={() =>
                          onOpenGroupFeedback?.(
                            (groupData ?? {
                              month,
                              comments: [],
                            }) as BoardGroupData,
                            month
                          )
                        }
                      >
                        <img
                          src="/images/icons/message-notification-active.svg"
                          alt="Unresolved Group Comment"
                          className="w-4 h-4"
                        />
                        <span
                          className="text-xs font-medium text-main"
                          title={`${
                            latestUnreaded.author
                          } left group comments ${timeAgo(
                            latestUnreaded.createdAt
                          )}`}
                        >
                          {latestUnreaded.author} left group comments{" "}
                          {timeAgo(latestUnreaded.createdAt)}
                        </span>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        className="flex items-center gap-1 pl-1 pr-1 py-[2px] bg-white rounded border-1 outline outline-1 outline-offset-[-1px] outline-main flex-shrink-0 cursor-pointer"
                        onClick={() =>
                          onOpenGroupFeedback?.(
                            (groupData ?? {
                              month,
                              comments: [],
                            }) as BoardGroupData,
                            month
                          )
                        }
                      >
                        <img
                          src="/images/icons/message-notification.svg"
                          alt="Group Comments"
                          className="w-4 h-4"
                        />
                        <span className="text-xs font-medium text-main">
                          Group Comments
                        </span>
                      </div>
                    );
                  }
                })()}
              </>
            )}
          </div>
        </td>

        {/* ▶ right phantom */}
        <th
          style={{
            width: 0,
            background: "#F8F8F8",
          }}
        />
      </tr>
      {isHoveringDivider &&
        typeof window !== "undefined" &&
        createPortal(
        <div
          className="pointer-events-none bg-[#151515] text-white border-none rounded-md text-xs font-medium px-3 py-1 shadow-md z-[1000]"
            style={{
              position: "fixed",
              left: cursorPos.x,
              top: cursorPos.y - 10,
              transform: "translate(-50%, -100%)",
            }}
          >
            {recordCountForTooltip}{" "}
            {recordCountForTooltip === 1 ? "record" : "records"}
        </div>,
        document.body
      )}
    </>
  );
}
