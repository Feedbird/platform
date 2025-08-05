"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { format, isToday, isYesterday, isThisWeek, isThisYear } from "date-fns";
import { ChevronLeft, ChevronDown, MoreHorizontal, Download, Trash2, Copy } from "lucide-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Post, Block, Version, useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { getCurrentUserDisplayName } from "@/lib/utils/user-utils";

// Avatar component for author display
function Avatar({ name }: { name: string }) {
  const COLORS = [
    "bg-rose-500", "bg-pink-500", "bg-fuchsia-500", "bg-purple-500", "bg-violet-500",
    "bg-indigo-500", "bg-blue-500", "bg-sky-500", "bg-cyan-500", "bg-teal-500",
    "bg-emerald-500", "bg-green-500", "bg-lime-500", "bg-yellow-500", "bg-amber-500",
  ];

  const avatarColor = COLORS[
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length
  ];

  return (
    <div
      className={cn(
        "w-4 h-4 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0",
        avatarColor
      )}
    >
      {name[0].toUpperCase()}
    </div>
  );
}

// Format date for display
function formatDate(date: Date): string {
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else if (isThisWeek(date)) {
    return format(date, "EEEE");
  } else if (isThisYear(date)) {
    return format(date, "MMMM d");
  } else {
    return format(date, "MMMM d, yyyy");
  }
}

// Format time for display
function formatTime(date: Date): string {
  return format(date, "h:mm a");
}

// Group versions by day
function groupVersionsByDay(blocks: Block[]): Array<{
  date: string;
  dateObj: Date;
  versions: Array<{
    block: Block;
    version: Version;
    versionNumber: number;
  }>;
}> {
  const allVersions: Array<{
    block: Block;
    version: Version;
    versionNumber: number;
  }> = [];

  // Collect all versions from all blocks
  blocks.forEach(block => {
    block.versions.forEach((version, index) => {
      allVersions.push({
        block,
        version,
        versionNumber: block.versions.length - index
      });
    });
  });

  // Sort by creation date (newest first)
  allVersions.sort((a, b) => new Date(b.version.createdAt).getTime() - new Date(a.version.createdAt).getTime());

  // Group by day
  const grouped = new Map<string, Array<{
    block: Block;
    version: Version;
    versionNumber: number;
  }>>();

  allVersions.forEach(item => {
    const dateKey = format(new Date(item.version.createdAt), "yyyy-MM-dd");
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(item);
  });

  // Convert to array and sort by date (newest first)
  return Array.from(grouped.entries())
    .map(([dateKey, versions]) => ({
      date: formatDate(new Date(dateKey)),
      dateObj: new Date(dateKey),
      versions
    }))
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}

interface VersionPanelProps {
  post: Post;
  onPreviewVersion?: (block: Block, versionId: string) => void;
}

export function VersionPanel({ post, onPreviewVersion }: VersionPanelProps) {
  const groupedVersions = groupVersionsByDay(post.blocks);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Store functions
  const addVersion = useFeedbirdStore((s) => s.addVersion);
  const setCurrentVersion = useFeedbirdStore((s) => s.setCurrentVersion);
  const addActivity = useFeedbirdStore((s) => s.addActivity);

  const toggleGroup = (date: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  const toggleDropdown = (versionId: string) => {
    setOpenDropdown(openDropdown === versionId ? null : versionId);
  };

  const handleRestoreVersion = (block: Block, version: Version) => {
    // Create a new version that duplicates the selected version
    const newVersionId = addVersion(post.id, block.id, {
      by: getCurrentUserDisplayName(),
      caption: version.caption,
      file: version.file
    });
    
    // Set the new version as the current version
    setCurrentVersion(post.id, block.id, newVersionId);
    
    // Add activity to track this action
    addActivity({
      postId: post.id,
      actor: getCurrentUserDisplayName(),
      action: "restored a previous version",
      type: "revised",
      metadata: {
        versionNumber: block.versions.length + 1
      }
    });
    
    // Close the dropdown
    setOpenDropdown(null);
  };

  const handleCopyLink = async (block: Block, version: Version) => {
      const mediaUrl = version.file.url;
      await navigator.clipboard.writeText(mediaUrl);
      setOpenDropdown(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (groupedVersions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Version History</h3>
        <p className="text-gray-500">Version history will appear here when you create new versions of your content.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full bg-[#FBF9F7]">
                 <div className="p-4">
             {groupedVersions.map((group, groupIndex) => (
             <div key={group.date} className="border-l border-elementStroke">
                  {/* Date header */}
                  <div className={cn(
                      "flex items-center justify-between px-3 py-1",
                      groupIndex > 0 && "border-t border-elementStroke"
                  )}>
                      <h3 className="text-sm font-semibold text-darkGrey">{group.date}</h3>
                      <button
                          onClick={() => toggleGroup(group.date)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                          {collapsedGroups.has(group.date) ? (
                              <ChevronLeft className="w-4 h-4 text-darkGrey cursor-pointer" />
                          ) : (
                              <ChevronDown className="w-4 h-4 text-darkGrey cursor-pointer" />
                          )}
                      </button>
                  </div>

                  {/* Versions for this day */}
                  {!collapsedGroups.has(group.date) && (
                      <div className="space-y-3">
                          {group.versions.map(({ block, version, versionNumber }, versionIndex) => (
                          <div
                              key={version.id}
                              className={cn(
                                  "flex gap-3 p-3 justify-between",
                                  versionIndex > 0 && "border-t border-elementStroke"
                              )}
                          >
                            <div className="flex gap-3 justify-center">
                                {/* Block thumbnail */}
                                <div className="relative w-10 h-10 rounded-sm overflow-hidden bg-gray-100 flex-shrink-0">
                                    {block.kind === "video" ? (
                                    <video
                                        src={version.file.url}
                                        className="w-full h-full object-cover"
                                        muted
                                    />
                                    ) : (
                                    <img
                                        src={version.file.url}
                                        alt={`Version ${versionNumber}`}
                                        className="w-full h-full object-cover"
                                    />
                                    )}
                                </div>
                                {/* Version details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            {/* Top line: Time and version */}
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 text-sm text-black">
                                                    {formatTime(new Date(version.createdAt))}
                                                </div>
                                                {/* Version indicator */}
                                                {block.currentVersionId === version.id && (
                                                <span className="text-sm font-medium text-darkGrey">
                                                    Current version
                                                </span>
                                                )}
                                            </div>
                                            {/* Second line: Author avatar and name */}
                                            <div className="flex items-center gap-2">
                                                <Avatar name={version.by} />
                                                <span className="text-sm font-medium text-darkGrey">
                                                    {version.by}
                                                </span>
                                            </div>
                                        </div>                  
                                    </div>
                                </div>  
                            </div>
                                <div className="flex items-center pr-1 relative">
                                 <button
                                     onClick={() => toggleDropdown(version.id)}
                                     className="hover:bg-gray-100 rounded transition-colors"
                                 >
                                     <MoreHorizontal size={18} className="text-gray-500 cursor-pointer" />
                                 </button>
                                 
                                 {/* Dropdown Menu */}
                                 {openDropdown === version.id && (
                                     <div 
                                         className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                                         ref={dropdownRef}
                                     >
                                         <div className="p-1">
                                             <button
                                                 className="flex items-center w-full px-4 py-2 text-sm text-black rounded-sm hover:bg-gray-100 transition-colors cursor-pointer  "
                                                 onClick={(e) => {
                                                     e.stopPropagation();
                                                     if (onPreviewVersion) {
                                                         onPreviewVersion(block, version.id);
                                                     }
                                                     setOpenDropdown(null);
                                                 }}
                                             >
                                                 Preview
                                             </button>
                                             <button
                                                 className="flex items-center w-full px-4 py-2 text-sm text-black rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
                                                 onClick={(e) => {
                                                     e.stopPropagation();
                                                     handleRestoreVersion(block, version);
                                                 }}
                                             >
                                                Restore this version
                                             </button>
                                             <button
                                                className="flex items-center w-full px-4 py-2 text-sm text-black rounded-sm hover:bg-gray-100 transition-colors cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyLink(block, version);
                                                }}
                                            >
                                                Copy Link
                                             </button>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         </div>
                         ))}
                     </div>
                 )}
             </div>
            ))}
        </div>
    </ScrollArea>
  );
} 