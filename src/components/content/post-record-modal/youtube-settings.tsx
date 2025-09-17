"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { YouTubeSettings } from '@/lib/social/platforms/platform-types';

interface YouTubeSettingsPanelProps {
  pageId: string | null;
  settings: YouTubeSettings;
  onChange: (settings: YouTubeSettings) => void;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}


const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can search for and view this video' },
  { value: 'unlisted', label: 'Unlisted', description: 'Anyone with the link can view this video' },
  { value: 'private', label: 'Private', description: 'Only you can view this video' },
];

export function YouTubeSettingsPanel({ 
  pageId, 
  settings, 
  onChange, 
  disabled = false,
  onValidationChange
}: YouTubeSettingsPanelProps) {

  // Validation logic for YouTube settings
  React.useEffect(() => {
    if (!onValidationChange) return;
    
    // For now, all settings are valid since we only have privacy and made for kids
    onValidationChange(true);
  }, [settings, onValidationChange]);

  if (!pageId) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-orange-50 border border-orange-200">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <p className="text-sm text-orange-800">
          Please select a YouTube channel to configure settings.
        </p>
      </div>
    );
  }

  const updateSetting = <K extends keyof YouTubeSettings>(
    key: K, 
    value: YouTubeSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };


  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Privacy Settings</Label>
        <Select
          value={settings.privacyStatus}
          onValueChange={(value: 'public' | 'private' | 'unlisted') => updateSetting('privacyStatus', value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIVACY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-600">{option.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Made for Kids */}
      <div className="space-y-3">
        <TooltipProvider>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="made-for-kids" className="text-sm font-medium">Made for Kids</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select "Yes" if your content is made for kids. This affects monetization and data collection.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              id="made-for-kids"
              checked={settings.madeForKids}
              onCheckedChange={(checked) => updateSetting('madeForKids', checked)}
              disabled={disabled}
            />
          </div>
        </TooltipProvider>
        
        {/* Made for Kids Warning */}
        {settings.madeForKids && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Made for Kids Content</p>
              <p className="text-xs mt-1">
                Videos marked as "Made for Kids" have limited monetization options and restricted data collection.
              </p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="video-description" className="text-sm font-medium">Video Description</Label>
          <textarea
            id="video-description"
            placeholder="Enter a detailed description for your video..."
            value={settings.description || ''}
            onChange={(e) => updateSetting('description', e.target.value || undefined)}
            disabled={disabled}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your post caption will be used as the video title. 
            Use this field above to write a detailed description for your YouTube video.
          </p>
        </div>
      </div>
    </div>
  );
}
