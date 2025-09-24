"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertCircle, Info, RefreshCw, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { usePinterestBoards } from '@/hooks/use-pinterest-boards';
import type { PinterestSettings } from '@/lib/social/platforms/platform-types';

interface PinterestSettingsPanelProps {
  pageId: string | null;
  settings: PinterestSettings;
  onChange: (settings: PinterestSettings) => void;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function PinterestSettingsPanel({ 
  pageId, 
  settings, 
  onChange, 
  disabled = false,
  onValidationChange
}: PinterestSettingsPanelProps) {
  console.log('PinterestSettingsPanel - Received settings:', settings);
  console.log('PinterestSettingsPanel - PageId:', pageId);
  
  const { boards, loading, error, refetch } = usePinterestBoards({ 
    pageId, 
    enabled: !!pageId 
  });
  
  console.log('PinterestSettingsPanel - Available boards:', boards);
  

  // Validation logic for Pinterest settings
  React.useEffect(() => {
    if (!onValidationChange) return;
    
    // Valid if we have a board selected
    const isValid = !!settings.boardId;
    onValidationChange(isValid);
  }, [settings, onValidationChange]);

  if (!pageId) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-orange-50 border border-orange-200">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <p className="text-sm text-orange-800">
          Please select a Pinterest account to configure settings.
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
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Failed to load Pinterest boards</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-1 text-red-600 hover:text-red-800 transition-colors"
            disabled={disabled}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800 font-medium">No boards found</p>
            <p className="text-xs text-yellow-700 mt-1">
              Please create a board on Pinterest first, then refresh this page.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-1 text-yellow-600 hover:text-yellow-800 transition-colors"
            disabled={disabled}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const updateSetting = <K extends keyof PinterestSettings>(
    key: K, 
    value: PinterestSettings[K]
  ) => {
    onChange({ ...settings, [key]: value });
  };

  const handleBoardChange = (boardId: string) => {
    console.log('PinterestSettingsPanel - Board change triggered:', boardId);
    console.log('PinterestSettingsPanel - Current settings before change:', settings);
    const selectedBoard = boards.find((board: any) => board.id === boardId);
    console.log('PinterestSettingsPanel - Selected board:', selectedBoard);
    if (selectedBoard) {
      const newSettings = {
        ...settings,
        boardId: boardId,
        boardName: selectedBoard.name
      };
      console.log('PinterestSettingsPanel - New settings to send:', newSettings);
      // Update both values in a single call to avoid race conditions
      onChange(newSettings);
    }
  };

  return (
    <div className="space-y-6">
      {/* Board Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Select Board</Label>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-blue-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Choose which Pinterest board to pin your content to</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <Select
          value={settings.boardId}
          onValueChange={handleBoardChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a board..." />
          </SelectTrigger>
          <SelectContent>
            {boards.map((board: any) => (
              <SelectItem key={board.id} value={board.id}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{board.name}</span>
                      {board.privacy === 'SECRET' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Lock className="h-3 w-3 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Secret board - only you can see this board</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {board.description && (
                      <div className="text-xs text-gray-600 truncate max-w-48">
                        {board.description}
                      </div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Pin Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Pin Title</Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-blue-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Custom title for your Pinterest pin (optional)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <Input
            value={settings.title || ''}
            onChange={(e) => updateSetting('title', e.target.value)}
            placeholder="Enter a custom title for your pin..."
            disabled={disabled}
            className="w-full"
          />
          
          <div className="text-xs text-gray-500">
            Leave empty to use default title: "Pin" + timestamp
          </div>
        </div>
        
        {settings.boardId && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <div className="flex-1">
              <p className="text-sm text-green-800 font-medium">Selected Board</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-green-700">{settings.boardName}</p>
                {(() => {
                  const selectedBoard = boards.find((board: any) => board.id === settings.boardId);
                  return selectedBoard?.privacy === 'SECRET' ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Lock className="h-3 w-3 text-green-600" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Secret board - only you can see this board</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Board Information */}
      {settings.boardId && (
        <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            <Label className="text-sm font-medium text-gray-700">Board Information</Label>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-medium">Board:</span> 
              <span>{settings.boardName}</span>
              {(() => {
                const selectedBoard = boards.find((board: any) => board.id === settings.boardId);
                return selectedBoard?.privacy === 'SECRET' ? (
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Secret</span>
                  </div>
                ) : selectedBoard?.privacy === 'PRIVATE' ? (
                  <span className="text-xs text-gray-500">Private</span>
                ) : (
                  <span className="text-xs text-gray-500">Public</span>
                );
              })()}
            </div>
            <p>
              <span className="font-medium">Total Boards:</span> {boards.length}
            </p>
            <p className="text-xs text-gray-500">
              Your pin will be added to the selected board when published.
            </p>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={() => refetch()}
          disabled={disabled || loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Boards
        </button>
      </div>
    </div>
  );
}
