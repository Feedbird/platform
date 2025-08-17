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
  onValidationChange?: (isValid: boolean) => void;
}

export function TikTokSettingsPanel({ 
  pageId, 
  settings, 
  onChange, 
  disabled = false,
  onValidationChange
}: TikTokSettingsPanelProps) {
  const { creatorInfo, loading, error } = useTikTokCreatorInfo({ 
    pageId, 
    enabled: !!pageId 
  });

  // Validation logic for TikTok settings
  React.useEffect(() => {
    if (!onValidationChange) return;
    
    let isValid = true;
    
    // Check if commercial content is properly configured
    if (settings.commercialContentToggle) {
      // Must have at least one brand option selected
      if (!settings.brandContentToggle && !settings.brandOrganicToggle) {
        isValid = false;
      }
      
      // Branded content cannot be private
      if (settings.brandContentToggle && settings.privacyLevel === 'SELF_ONLY') {
        isValid = false;
      }
    }
    
    onValidationChange(isValid);
  }, [settings, onValidationChange]);

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
            {creatorInfo.privacyLevelOptions.map((privacy) => {
              // Disable private option when branded content is selected
              const isDisabled = privacy === 'SELF_ONLY' && 
                settings.commercialContentToggle && 
                settings.brandContentToggle;
              
              return (
                <SelectItem 
                  key={privacy} 
                  value={privacy}
                  disabled={isDisabled}
                  className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  <div>
                    <div className="font-medium">{formatPrivacyLabel(privacy)}</div>
                    <div className="text-xs text-gray-600">{getPrivacyDescription(privacy)}</div>
                    {isDisabled && (
                      <div className="text-xs text-orange-600 mt-1">
                        Branded content cannot be private
                      </div>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {/* Privacy Restriction Warning */}
        {settings.commercialContentToggle && settings.brandContentToggle && settings.privacyLevel === 'SELF_ONLY' && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <p className="text-xs text-orange-800">
              Branded content visibility cannot be set to private. Please select a public visibility option.
            </p>
          </div>
        )}
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

      {/* Commercial Content Disclosure (Required by TikTok) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Commercial Content Disclosure</Label>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Required by TikTok for promotional content</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <div className="space-y-4">
          {/* Commercial Content Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="commercial-content" className="text-sm">Commercial Content</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You need to indicate if your content promotes yourself, a third party, or both. At least one brand option must be selected.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-xs text-gray-600">This content promotes a brand, product, or service</p>
            </div>
            <Switch
              id="commercial-content"
              checked={settings.commercialContentToggle}
              onCheckedChange={(checked) => {
                if (!checked) {
                  // Reset all settings in one update when commercial content is disabled
                  onChange({
                    ...settings,
                    commercialContentToggle: false,
                    brandContentToggle: false,
                    brandOrganicToggle: false
                  });
                } else {
                  // Enable commercial content
                  onChange({
                    ...settings,
                    commercialContentToggle: true
                  });
                }
              }}
              disabled={disabled}
            />
          </div>

          {/* Brand Options (only shown when commercial content is enabled) */}
          {settings.commercialContentToggle && (
            <div className="pl-4 space-y-3 border-l-2 border-gray-200">
              {/* Your Brand */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="brand-organic" className="text-sm">Your Brand</Label>
                  <p className="text-xs text-gray-600">Promoting yourself or your own business</p>
                </div>
                <Switch
                  id="brand-organic"
                  checked={settings.brandOrganicToggle}
                  onCheckedChange={(checked) => updateSetting('brandOrganicToggle', checked)}
                  disabled={disabled}
                />
              </div>

              {/* Branded Content */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="brand-content" className="text-sm">Branded Content</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-blue-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Branded content visibility cannot be set to private. If you select this option, your privacy will automatically switch to public.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-gray-600">Promoting another brand or third party</p>
                </div>
                <Switch
                  id="brand-content"
                  checked={settings.brandContentToggle}
                  onCheckedChange={(checked) => {
                    if (checked && settings.privacyLevel === 'SELF_ONLY') {
                      // Auto-switch to public when branded content is enabled
                      onChange({
                        ...settings,
                        brandContentToggle: checked,
                        privacyLevel: 'PUBLIC_TO_EVERYONE'
                      });
                    } else {
                      onChange({
                        ...settings,
                        brandContentToggle: checked
                      });
                    }
                  }}
                  disabled={disabled}
                />
              </div>

              {/* Validation Message */}
              {settings.commercialContentToggle && !settings.brandContentToggle && !settings.brandOrganicToggle && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <p className="text-xs text-orange-800">
                    You must select at least one brand option to proceed
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Content Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Content Settings</Label>
        
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

      {/* Policy Compliance & Declarations */}
      {(settings.commercialContentToggle || settings.autoAddMusic) && (
        <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <Label className="text-sm font-medium text-blue-900">Policy Compliance Required</Label>
          </div>
          
          <div className="space-y-3">
            {/* Content Labeling Information */}
            {settings.commercialContentToggle && (
              <div className="space-y-2">
                <p className="text-xs text-blue-800 font-medium">Your content will be labeled as:</p>
                {settings.brandOrganicToggle && !settings.brandContentToggle && (
                  <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                    <span className="text-xs font-semibold text-blue-900">"Promotional content"</span>
                  </div>
                )}
                {settings.brandContentToggle && !settings.brandOrganicToggle && (
                  <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                    <span className="text-xs font-semibold text-blue-900">"Paid partnership"</span>
                  </div>
                )}
                {settings.brandContentToggle && settings.brandOrganicToggle && (
                  <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                    <span className="text-xs font-semibold text-blue-900">"Paid partnership"</span>
                  </div>
                )}
              </div>
            )}

            {/* Policy Agreements */}
            <div className="space-y-2">
              <p className="text-xs text-blue-800 font-medium">By posting, you agree to:</p>
              <div className="space-y-1">
                {/* Music Usage Confirmation - always required when music is enabled */}
                {settings.autoAddMusic && (
                  <p className="text-xs text-blue-700">
                    • <a 
                        href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        TikTok's Music Usage Confirmation
                      </a>
                  </p>
                )}
                
                {/* Branded Content Policy - only when commercial content is enabled */}
                {settings.commercialContentToggle && (
                  <p className="text-xs text-blue-700">
                    • <a 
                        href="https://www.tiktok.com/legal/page/global/bc-policy/en" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        TikTok's Branded Content Policy
                      </a>
                  </p>
                )}
              </div>
            </div>

            {/* Publishing Restrictions */}
            {settings.commercialContentToggle && !settings.brandContentToggle && !settings.brandOrganicToggle && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <p className="text-xs text-orange-800">
                  You must select at least one brand option to proceed with publishing
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
