"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Users, Heart, Video, UserPlus, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TikTokMetadata {
  // user.info.basic scope
  openId?: string;
  unionId?: string;
  avatarUrl?: string;
  avatarUrl100?: string;
  avatarLargeUrl?: string;
  displayName?: string;
  
  // user.info.profile scope  
  bio?: string;
  profileUrl?: string;
  isVerified?: boolean;
  username?: string;
  
  // user.info.stats scope
  followerCount?: number;
  followingCount?: number;
  likesCount?: number;
  videoCount?: number;
}

interface TikTokAccountInfoProps {
  metadata: TikTokMetadata;
  displayName: string;
}

function formatCount(count: number | undefined): string {
  if (count === undefined || count === null) return "0";
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function TikTokAccountInfo({ metadata, displayName }: TikTokAccountInfoProps) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
      {/* Header with avatar and verified badge */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {metadata.avatarUrl && (
          <img 
            src={metadata.avatarUrl} 
            alt={metadata.displayName || displayName}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
          />
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {metadata.displayName || displayName}
            </span>
            {metadata.isVerified && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Verified Account</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Username */}
          {metadata.username && (
            <div className="text-xs text-gray-500">@{metadata.username}</div>
          )}
          
          {/* Bio */}
          {metadata.bio && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{metadata.bio}</p>
          )}
        </div>
        
        {metadata.profileUrl && (
          <a
            href={metadata.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-main hover:text-main/80 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <Separator className="bg-gray-300" />

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Followers */}
        {metadata.followerCount !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-medium">Followers</div>
              <div className="text-sm font-bold text-gray-900">
                {formatCount(metadata.followerCount)}
              </div>
            </div>
          </div>
        )}

        {/* Following */}
        {metadata.followingCount !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              <UserPlus className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-medium">Following</div>
              <div className="text-sm font-bold text-gray-900">
                {formatCount(metadata.followingCount)}
              </div>
            </div>
          </div>
        )}

        {/* Likes */}
        {metadata.likesCount !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-pink-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-medium">Likes</div>
              <div className="text-sm font-bold text-gray-900">
                {formatCount(metadata.likesCount)}
              </div>
            </div>
          </div>
        )}

        {/* Videos */}
        {metadata.videoCount !== undefined && (
          <div className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 font-medium">Videos</div>
              <div className="text-sm font-bold text-gray-900">
                {formatCount(metadata.videoCount)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
