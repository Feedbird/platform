// CaptionRules.ts
"use client";

import { Platform } from "@/lib/social/platforms/platform-types";

/** For demonstration: wordcount limit by platform  */
const WORD_LIMITS: Record<Platform, number> = {
  facebook: 2200,
  instagram: 2200,
  linkedin: 1300,
  pinterest: 500,
  youtube: 5000,
  tiktok: 150,
  google: 300,
};

export function checkCaptionQuality(text:string, platform:Platform): string {
  // 1) check word limit
  const limit = WORD_LIMITS[platform] ?? 9999;
  const wordCount = text.split(/\s+/).length;
  if(wordCount > limit) {
    return `Too long for ${platform} (max ${limit} words). You have ${wordCount}.`;
  }
  
  // 2) check phone number (like "555-1234")
  if(platform==="google" && /\d{3}-\d{3}-\d{4}/.test(text)){
    return "Google posts cannot contain phone numbers.";
  }
  
  // no error
  return "";
}
