"use client";

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Calendar, Clock, Tag, Globe, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import type { 
  GoogleBusinessSettings, 
  GoogleBusinessPostType, 
  GoogleBusinessCTAAction 
} from '@/lib/social/platforms/platform-types';
import { validateGoogleBusinessSettings } from '@/lib/utils/google-business-settings-mapper';

interface GoogleBusinessSettingsPanelProps {
  pageId: string | null;
  settings: GoogleBusinessSettings;
  onChange: (settings: GoogleBusinessSettings) => void;
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function GoogleBusinessSettingsPanel({ 
  pageId, 
  settings, 
  onChange, 
  disabled = false,
  onValidationChange
}: GoogleBusinessSettingsPanelProps) {
  // Validation state
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);
  
  // Expandable sections state
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});

  // Validate settings whenever they change
  React.useEffect(() => {
    const validation = validateGoogleBusinessSettings(settings);
    setValidationErrors(validation.errors);
    onValidationChange?.(validation.isValid);
  }, [settings, onValidationChange]);

  if (!pageId) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg bg-orange-50 border border-orange-200">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <p className="text-sm text-orange-800">
          Please select a Google Business location to configure settings.
        </p>
      </div>
    );
  }

  const updateSetting = <K extends keyof GoogleBusinessSettings>(
    key: K, 
    value: GoogleBusinessSettings[K]
  ) => {
    if (disabled) return;
    onChange({ ...settings, [key]: value });
  };

  const updateNestedSetting = (
    key: 'callToAction' | 'event' | 'offer',
    nestedKey: string,
    value: any
  ) => {
    if (disabled) return;
    
    const updatedSettings = { ...settings };
    
    if (key === 'callToAction') {
      const currentCTA = settings.callToAction || { actionType: 'LEARN_MORE' as GoogleBusinessCTAAction, url: '' };
      updatedSettings.callToAction = { ...currentCTA, [nestedKey]: value };
    } else if (key === 'event') {
      const currentEvent = settings.event || { title: '', description: '', startDate: getCurrentDate() };
      updatedSettings.event = { ...currentEvent, [nestedKey]: value };
    } else if (key === 'offer') {
      const currentOffer = settings.offer || { couponCode: '', redeemOnlineUrl: '', termsConditions: '' };
      updatedSettings.offer = { ...currentOffer, [nestedKey]: value };
    }
    
    onChange(updatedSettings);
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // CTA Action options with descriptions
  const ctaActions: { value: GoogleBusinessCTAAction; label: string; description: string }[] = [
    { value: 'BOOK', label: 'Book', description: 'Book an appointment, table, or reservation' },
    { value: 'ORDER', label: 'Order', description: 'Order products or services' },
    { value: 'SHOP', label: 'Shop', description: 'Browse product catalog' },
    { value: 'LEARN_MORE', label: 'Learn More', description: 'See additional details on website' },
    { value: 'SIGN_UP', label: 'Sign Up', description: 'Register, sign up, or join' },
    { value: 'CALL', label: 'Call', description: 'Call the business' },
  ];

  // Post type options
  const postTypes: { value: GoogleBusinessPostType; label: string; description: string; icon: React.ReactNode }[] = [
    { 
      value: 'STANDARD', 
      label: 'Standard Post', 
      description: 'Regular post with optional call-to-action',
      icon: <Globe className="h-4 w-4" />
    },
    { 
      value: 'EVENT', 
      label: 'Event Post', 
      description: 'Promote an upcoming event with date and time',
      icon: <Calendar className="h-4 w-4" />
    },
    { 
      value: 'OFFER', 
      label: 'Offer Post', 
      description: 'Share deals, coupons, and special offers',
      icon: <Tag className="h-4 w-4" />
    },
  ];

  // Helper function to get current date for date inputs
  const getCurrentDate = () => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate()
    };
  };

  // Helper function to format date for input
  const formatDateForInput = (date: { year: number; month: number; day: number }) => {
    return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  };

  // Helper function to parse date from input
  const parseDateFromInput = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return { year, month, day };
  };

  // Helper function to format time for input
  const formatTimeForInput = (time?: { hours: number; minutes: number }) => {
    if (!time) return '';
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
  };

  // Helper function to parse time from input
  const parseTimeFromInput = (timeString: string) => {
    if (!timeString) return undefined;
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes, seconds: 0, nanos: 0 };
  };

  return (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Settings Validation Errors</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="ml-4">• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Post Type Toggle Buttons */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        {postTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => {
              // Initialize proper structure based on post type
              const newSettings = { ...settings, postType: type.value };
              
              // Initialize event structure for EVENT posts
              if (type.value === 'EVENT' && !settings.event) {
                const currentDate = getCurrentDate();
                newSettings.event = {
                  title: '',
                  startDate: currentDate
                };
              }
              
              // Initialize offer structure for OFFER posts
              if (type.value === 'OFFER' && !settings.offer) {
                const currentDate = getCurrentDate();
                newSettings.offer = {
                  title: '',
                  couponCode: '',
                  redeemOnlineUrl: '',
                  termsConditions: '',
                  startDate: currentDate
                };
              }
              
              onChange(newSettings);
            }}
            disabled={disabled}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              settings.postType === type.value
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Main Content Fields - Only show for EVENT and OFFER posts */}
      {(settings.postType === 'EVENT' || settings.postType === 'OFFER') && (
        <div className="space-y-4">
          {/* Title Field */}
          <div>
            <div className="relative">
              <Input
                placeholder={
                  settings.postType === 'EVENT' ? 'Title*' : 'Add a title for your offer'
                }
                value={
                  settings.postType === 'EVENT' ? settings.event?.title || '' :
                  settings.postType === 'OFFER' ? (settings.offer?.title || '') :
                  ''
                }
                onChange={(e) => {
                  if (settings.postType === 'EVENT') {
                    updateNestedSetting('event', 'title', e.target.value);
                  } else if (settings.postType === 'OFFER') {
                    updateNestedSetting('offer', 'title', e.target.value);
                  }
                }}
                disabled={disabled}
                className="pr-16"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {settings.postType === 'EVENT' ? 
                  `${(settings.event?.title || '').length}/58` : 
                  `${(settings.offer?.title || '').length}/58`
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date/Time Fields for Events and Offers */}
      {(settings.postType === 'EVENT' || settings.postType === 'OFFER') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              type="date"
              placeholder="Start date*"
              value={
                settings.postType === 'EVENT' 
                  ? (settings.event?.startDate ? formatDateForInput(settings.event.startDate) : '')
                  : (settings.offer?.startDate ? formatDateForInput(settings.offer.startDate) : '')
              }
              onChange={(e) => {
                if (e.target.value) {
                  if (settings.postType === 'EVENT') {
                    updateNestedSetting('event', 'startDate', parseDateFromInput(e.target.value));
                  } else {
                    updateNestedSetting('offer', 'startDate', parseDateFromInput(e.target.value));
                  }
                }
              }}
              disabled={disabled}
              min={formatDateForInput(getCurrentDate())}
            />
          </div>
          <div>
            <Input
              type="time"
              placeholder="Start time"
              value={
                settings.postType === 'EVENT'
                  ? formatTimeForInput(settings.event?.startTime)
                  : formatTimeForInput(settings.offer?.startTime)
              }
              onChange={(e) => {
                if (settings.postType === 'EVENT') {
                  updateNestedSetting('event', 'startTime', parseTimeFromInput(e.target.value));
                } else {
                  updateNestedSetting('offer', 'startTime', parseTimeFromInput(e.target.value));
                }
              }}
              disabled={disabled}
            />
          </div>
          <div>
            <Input
              type="date"
              placeholder="End Date*"
              value={
                settings.postType === 'EVENT'
                  ? (settings.event?.endDate ? formatDateForInput(settings.event.endDate) : '')
                  : (settings.offer?.endDate ? formatDateForInput(settings.offer.endDate) : '')
              }
              onChange={(e) => {
                if (e.target.value) {
                  if (settings.postType === 'EVENT') {
                    updateNestedSetting('event', 'endDate', parseDateFromInput(e.target.value));
                  } else {
                    updateNestedSetting('offer', 'endDate', parseDateFromInput(e.target.value));
                  }
                } else {
                  if (settings.postType === 'EVENT') {
                    updateNestedSetting('event', 'endDate', undefined);
                  } else {
                    updateNestedSetting('offer', 'endDate', undefined);
                  }
                }
              }}
              disabled={disabled}
              min={
                settings.postType === 'EVENT'
                  ? (settings.event?.startDate ? formatDateForInput(settings.event.startDate) : '')
                  : (settings.offer?.startDate ? formatDateForInput(settings.offer.startDate) : '')
              }
            />
          </div>
          <div>
            <Input
              type="time"
              placeholder="End time"
              value={
                settings.postType === 'EVENT'
                  ? formatTimeForInput(settings.event?.endTime)
                  : formatTimeForInput(settings.offer?.endTime)
              }
              onChange={(e) => {
                if (settings.postType === 'EVENT') {
                  updateNestedSetting('event', 'endTime', parseTimeFromInput(e.target.value));
                } else {
                  updateNestedSetting('offer', 'endTime', parseTimeFromInput(e.target.value));
                }
              }}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Add more details section */}
      <div className="mt-6">
        <div className="text-sm font-medium text-gray-700 mb-4">Add more details</div>
        
        <div className="space-y-3">
          {/* Conditional expandable sections based on post type */}
          {settings.postType === 'EVENT' && (
            <>
              {/* Button (CTA) for Events */}
              <div className="border rounded-lg">
                <button
                  onClick={() => toggleSection('eventCTA')}
                  disabled={disabled}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Button</span>
                  </div>
                  {expandedSections.eventCTA ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {expandedSections.eventCTA && (
                  <div className="px-3 pb-3 space-y-3 border-t">
                    <div>
                      <Label className="text-sm">Action Type</Label>
                      <Select
                        value={settings.event?.callToAction?.actionType || 'LEARN_MORE'}
                        onValueChange={(value: GoogleBusinessCTAAction) =>
                          updateNestedSetting('event', 'callToAction', {
                            ...(settings.event?.callToAction || {}),
                            actionType: value,
                            url: settings.event?.callToAction?.url || ''
                          })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ctaActions.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">URL</Label>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={settings.event?.callToAction?.url || ''}
                        onChange={(e) => 
                          updateNestedSetting('event', 'callToAction', {
                            ...(settings.event?.callToAction || { actionType: 'LEARN_MORE' as GoogleBusinessCTAAction }),
                            url: e.target.value
                          })
                        }
                        disabled={disabled}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {settings.postType === 'OFFER' && (
            <>
              {/* Terms for Offers */}
              <div className="border rounded-lg">
                <button
                  onClick={() => toggleSection('terms')}
                  disabled={disabled}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Terms</span>
                  </div>
                  {expandedSections.terms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {expandedSections.terms && (
                  <div className="px-3 pb-3 border-t">
                    <Textarea
                      placeholder="Enter terms and conditions"
                      value={settings.offer?.termsConditions || ''}
                      onChange={(e) => updateNestedSetting('offer', 'termsConditions', e.target.value)}
                      disabled={disabled}
                      className="mt-3"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              {/* Coupon code for Offers */}
              <div className="border rounded-lg">
                <button
                  onClick={() => toggleSection('couponCode')}
                  disabled={disabled}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Coupon code</span>
                  </div>
                  {expandedSections.couponCode ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {expandedSections.couponCode && (
                  <div className="px-3 pb-3 border-t">
                    <Input
                      placeholder="e.g., SAVE20"
                      value={settings.offer?.couponCode || ''}
                      onChange={(e) => updateNestedSetting('offer', 'couponCode', e.target.value)}
                      disabled={disabled}
                      className="mt-3"
                    />
                  </div>
                )}
              </div>

              {/* Link to redeem offer */}
              <div className="border rounded-lg">
                <button
                  onClick={() => toggleSection('redeemLink')}
                  disabled={disabled}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Link to redeem offer</span>
                  </div>
                  {expandedSections.redeemLink ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {expandedSections.redeemLink && (
                  <div className="px-3 pb-3 border-t">
                    <Input
                      type="url"
                      placeholder="https://example.com/redeem"
                      value={settings.offer?.redeemOnlineUrl || ''}
                      onChange={(e) => updateNestedSetting('offer', 'redeemOnlineUrl', e.target.value)}
                      disabled={disabled}
                      className="mt-3"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {settings.postType === 'STANDARD' && (
            <>
              {/* Button (CTA) for Standard posts */}
              <div className="border rounded-lg">
                <button
                  onClick={() => toggleSection('standardCTA')}
                  disabled={disabled}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Button</span>
                  </div>
                  {expandedSections.standardCTA ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {expandedSections.standardCTA && (
                  <div className="px-3 pb-3 space-y-3 border-t">
                    <div>
                      <Label className="text-sm">Action Type</Label>
                      <Select
                        value={settings.callToAction?.actionType || 'LEARN_MORE'}
                        onValueChange={(value: GoogleBusinessCTAAction) =>
                          updateSetting('callToAction', {
                            ...(settings.callToAction || {}),
                            actionType: value,
                            url: settings.callToAction?.url || ''
                          })
                        }
                        disabled={disabled}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ctaActions.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">URL</Label>
                      <Input
                        type="url"
                        placeholder="https://example.com"
                        value={settings.callToAction?.url || ''}
                        onChange={(e) => 
                          updateSetting('callToAction', {
                            ...(settings.callToAction || { actionType: 'LEARN_MORE' as GoogleBusinessCTAAction }),
                            url: e.target.value
                          })
                        }
                        disabled={disabled}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
