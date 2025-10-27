"use client";

import React, { useState, useEffect } from "react";
import { Post } from "@/lib/store";
import { User } from "@/lib/store/types";
import { userApi } from "@/lib/api/api-service";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn, getFullnameinitial } from "@/lib/utils";

// User cache to avoid repeated API calls
const userCache = new Map<string, User>();

interface UserDisplayProps {
  userEmail?: string;
  className?: string;
}

function UserDisplay({ userEmail, className }: UserDisplayProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userEmail) return;

    // Check cache first
    if (userCache.has(userEmail)) {
      setUser(userCache.get(userEmail)!);
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      setError(false);
      try {
        const userData = await userApi.getUser({ email: userEmail });
        userCache.set(userEmail, userData);
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userEmail]);

  if (!userEmail) {
    return (
      <span className={cn("text-xs text-[#5C5E63] font-normal", className)}>
        Unknown
      </span>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
        <span className="text-xs text-[#5C5E63] font-normal">Loading...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-xs text-darkGrey">?</span>
        </div>
        <span className="text-xs text-[#5C5E63] font-normal">{userEmail}</span>
      </div>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
  const avatarUrl = user.imageUrl;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2 cursor-default", className)}>
            <Avatar className="w-6 h-6">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-[10px] font-medium">
                {getFullnameinitial(undefined, undefined, fullName || user.email || '?')}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-darkGrey font-normal whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
              {fullName}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-white text-black border-none text-xs shadow-lg">
          <div className="flex flex-col gap-1">
            <div className="font-medium">{fullName}</div>
            <div className="text-xs opacity-75">{user.email}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function CreatedByCell({ post }: { post: Post }) {
  return (
    <div className="flex items-center h-full px-2 py-[6px]">
      <UserDisplay userEmail={post.createdBy} />
    </div>
  );
}

export function LastModifiedByCell({ post }: { post: Post }) {
  return (
    <div className="flex items-center h-full px-2 py-[6px]">
      <UserDisplay userEmail={post.lastUpdatedBy} />
    </div>
  );
}
