"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTikTokCreatorInfo } from '@/hooks/use-tiktok-creator-info';
import type { TikTokSettings, TikTokPrivacyLevel } from '@/lib/social/platforms/platform-types';

interface TikTokSettingsPanelProps {
  pageId: string | null;
  settings: TikTokSettings;
  onChange: (settings: TikTokSettings) => void;
  disabled?: boolean;
}

export function TikTokSettingsPanel({ 
  pageId, 
  settings, 
  onChange, 
  disabled = false 
}: TikTokSettingsPanelProps) {
  const { creatorInfo, loading, error } = useTikTokCreatorInfo({ 
    pageId, 
    enabled: !!pageId 
  });

  if (!pageId) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-orange-50 border border-orange-200">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <p className="text-sm text-orange-800">
          Please select a TikTok account to configure settings.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <p className="text-sm text-red-800">
          Failed to load TikTok account settings: {error}
        </p>
      </div>
    );
  }

  if (!creatorInfo) {
    return null;
  }

  const updateSetting = <K extends keyof TikTokSettings>(
    key: K, 
    value: TikTokSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const formatPrivacyLabel = (privacy: TikTokPrivacyLevel): string => {
    switch (privacy) {
      case 'PUBLIC_TO_EVERYONE':
        return 'Public';
      case 'MUTUAL_FOLLOW_FRIENDS':
        return 'Friends Only';
      case 'FOLLOWER_OF_CREATOR':
        return 'Followers Only';
      case 'SELF_ONLY':
        return 'Private';
      default:
        return privacy;
    }
  };

  const getPrivacyDescription = (privacy: TikTokPrivacyLevel): string => {
    switch (privacy) {
      case 'PUBLIC_TO_EVERYONE':
        return 'Anyone can view this video';
      case 'MUTUAL_FOLLOW_FRIENDS':
        return 'Only mutual friends can view';
      case 'FOLLOWER_OF_CREATOR':
        return 'Only followers can view';
      case 'SELF_ONLY':
        return 'Only you can view this video';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Creator Info Header */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <img 
          src={creatorInfo.creatorAvatarUrl} 
          alt={creatorInfo.creatorNickname}
          className="w-10 h-10 rounded-full"
        />
        <div>
          <div className="font-medium">{creatorInfo.creatorNickname}</div>
          <div className="text-sm text-gray-600">@{creatorInfo.creatorUsername}</div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Privacy Level</Label>
        <Select
          value={settings.privacyLevel}
          onValueChange={(value: TikTokPrivacyLevel) => updateSetting('privacyLevel', value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {creatorInfo.privacyLevelOptions.map((privacy) => (
              <SelectItem key={privacy} value={privacy}>
                <div>
                  <div className="font-medium">{formatPrivacyLabel(privacy)}</div>
                  <div className="text-xs text-gray-600">{getPrivacyDescription(privacy)}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Interaction Controls */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Interaction Settings</Label>
        
        <TooltipProvider>
          <div className="space-y-3">
            {/* Comments */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="disable-comments" className="text-sm">Disable Comments</Label>
                {creatorInfo.commentDisabled && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-orange-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Comments are disabled in your TikTok privacy settings</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Switch
                id="disable-comments"
                checked={settings.disableComment}
                onCheckedChange={(checked) => updateSetting('disableComment', checked)}
                disabled={disabled || creatorInfo.commentDisabled}
              />
            </div>

            {/* Duets */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="disable-duets" className="text-sm">Disable Duets</Label>
                {creatorInfo.duetDisabled && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-orange-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duets are disabled in your TikTok privacy settings</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Switch
                id="disable-duets"
                checked={settings.disableDuet}
                onCheckedChange={(checked) => updateSetting('disableDuet', checked)}
                disabled={disabled || creatorInfo.duetDisabled}
              />
            </div>

            {/* Stitches */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="disable-stitches" className="text-sm">Disable Stitches</Label>
                {creatorInfo.stitchDisabled && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-orange-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stitches are disabled in your TikTok privacy settings</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Switch
                id="disable-stitches"
                checked={settings.disableStitch}
                onCheckedChange={(checked) => updateSetting('disableStitch', checked)}
                disabled={disabled || creatorInfo.stitchDisabled}
              />
            </div>
          </div>
        </TooltipProvider>
      </div>

      <Separator />

      {/* Video Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Video Settings</Label>
        
        <div className="space-y-3">
          {/* Auto Add Music */}
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-add-music" className="text-sm">Auto-add Music</Label>
            <Switch
              id="auto-add-music"
              checked={settings.autoAddMusic}
              onCheckedChange={(checked) => updateSetting('autoAddMusic', checked)}
              disabled={disabled}
            />
          </div>

          {/* Video Cover Timestamp */}
          <div className="space-y-2">
            <Label htmlFor="video-cover" className="text-sm">
              Cover Frame Time (seconds)
            </Label>
            <Input
              id="video-cover"
              type="number"
              min="0"
              max={creatorInfo.maxVideoPostDurationSec}
              step="0.1"
              value={settings.videoCoverTimestampMs ? settings.videoCoverTimestampMs / 1000 : ''}
              onChange={(e) => {
                const seconds = parseFloat(e.target.value);
                updateSetting('videoCoverTimestampMs', isNaN(seconds) ? undefined : seconds * 1000);
              }}
              placeholder="Auto-select cover"
              disabled={disabled}
              className="max-w-32"
            />
            <p className="text-xs text-gray-600">
              Leave empty to auto-select cover frame. Max duration: {creatorInfo.maxVideoPostDurationSec}s
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Brand Content Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Brand Content</Label>
        
        <div className="space-y-3">
          {/* Paid Partnership */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="brand-content" className="text-sm">Paid Partnership</Label>
              <p className="text-xs text-gray-600">Mark as sponsored content</p>
            </div>
            <Switch
              id="brand-content"
              checked={settings.brandContentToggle}
              onCheckedChange={(checked) => updateSetting('brandContentToggle', checked)}
              disabled={disabled}
            />
          </div>

          {/* Own Business */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="brand-organic" className="text-sm">Promote Own Business</Label>
              <p className="text-xs text-gray-600">Promoting your own brand/business</p>
            </div>
            <Switch
              id="brand-organic"
              checked={settings.brandOrganicToggle}
              onCheckedChange={(checked) => updateSetting('brandOrganicToggle', checked)}
              disabled={disabled}
            />
          </div>

          {/* AI Generated Content */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ai-generated" className="text-sm">AI Generated Content</Label>
              <p className="text-xs text-gray-600">Mark content as AI-generated</p>
            </div>
            <Switch
              id="ai-generated"
              checked={settings.isAigc}
              onCheckedChange={(checked) => updateSetting('isAigc', checked)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
