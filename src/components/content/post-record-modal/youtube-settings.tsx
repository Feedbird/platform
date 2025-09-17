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

// YouTube category options (most common ones)
const YOUTUBE_CATEGORIES = [
  { id: '22', name: 'People & Blogs' },
  { id: '23', name: 'Comedy' },
  { id: '24', name: 'Entertainment' },
  { id: '25', name: 'News & Politics' },
  { id: '26', name: 'Howto & Style' },
  { id: '27', name: 'Education' },
  { id: '28', name: 'Science & Technology' },
  { id: '10', name: 'Music' },
  { id: '15', name: 'Pets & Animals' },
  { id: '17', name: 'Sports' },
  { id: '19', name: 'Travel & Events' },
  { id: '20', name: 'Gaming' },
  { id: '21', name: 'Videoblogging' },
];

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
    
    let isValid = true;
    
    // Check if tags are within limit (500 characters total)
    if (settings.tags && settings.tags.length > 0) {
      const totalTagLength = settings.tags.join(',').length;
      if (totalTagLength > 500) {
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

  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    const newTags = [...(settings.tags || []), tag.trim()];
    updateSetting('tags', newTags);
  };

  const removeTag = (index: number) => {
    const newTags = settings.tags?.filter((_, i) => i !== index) || [];
    updateSetting('tags', newTags);
  };

  const totalTagLength = settings.tags?.join(',').length || 0;

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

      {/* Content Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Content Settings</Label>
        
        <TooltipProvider>
          <div className="space-y-3">
            {/* Made for Kids */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="made-for-kids" className="text-sm">Made for Kids</Label>
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

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm">Category</Label>
              <Select
                value={settings.categoryId || '22'}
                onValueChange={(value) => updateSetting('categoryId', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {YOUTUBE_CATEGORIES.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TooltipProvider>
      </div>

      <Separator />

      {/* Tags */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Tags</Label>
          <span className="text-xs text-gray-500">{totalTagLength}/500 characters</span>
        </div>
        
        <div className="space-y-3">
          {/* Add Tag Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              disabled={disabled}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                addTag(input.value);
                input.value = '';
              }}
              disabled={disabled}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
            >
              Add
            </button>
          </div>

          {/* Tags Display */}
          {settings.tags && settings.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {settings.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    disabled={disabled}
                    className="ml-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag Length Warning */}
          {totalTagLength > 500 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-xs text-red-800">
                Total tag length exceeds 500 characters. Please remove some tags.
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Language Settings */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Language Settings</Label>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Default Language */}
          <div className="space-y-2">
            <Label htmlFor="default-language" className="text-sm">Default Language</Label>
            <Select
              value={settings.defaultLanguage || 'en'}
              onValueChange={(value) => updateSetting('defaultLanguage', value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Audio Language */}
          <div className="space-y-2">
            <Label htmlFor="audio-language" className="text-sm">Audio Language</Label>
            <Select
              value={settings.defaultAudioLanguage || 'en'}
              onValueChange={(value) => updateSetting('defaultAudioLanguage', value)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Thumbnail */}
      <div className="space-y-3">
        <Label htmlFor="thumbnail-url" className="text-sm font-medium">Custom Thumbnail URL (Optional)</Label>
        <Input
          id="thumbnail-url"
          type="url"
          placeholder="https://example.com/thumbnail.jpg"
          value={settings.thumbnailUrl || ''}
          onChange={(e) => updateSetting('thumbnailUrl', e.target.value || undefined)}
          disabled={disabled}
        />
        <p className="text-xs text-gray-600">
          YouTube will auto-generate thumbnails if not provided. Custom thumbnails must be under 2MB.
        </p>
      </div>

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
  );
}
