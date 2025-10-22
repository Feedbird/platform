import * as React from 'react'
import Image from 'next/image'
import { Platform } from '@/lib/social/platforms/platform-types';
import { Tooltip } from "@mui/material";
import { Status } from '@/lib/store';

// Status configuration with updated styles and icons
export const statusConfig: Record<Status, {
  icon: string, // Path to SVG icon
  bgColor: string,
  borderColor: string,
  textColor: string
}> = {
  "Draft": {
    icon: "/images/status/draft.svg",
    bgColor: "#F4F7FA",
    borderColor: "rgba(28, 29, 31, 0.05)",
    textColor: "#1C1D1F"
  },
  "Pending Approval": {
    icon: "/images/status/pending-approval.svg", 
    bgColor: "#FAF2CA",
    borderColor: "rgba(28, 29, 31, 0.05)",
    textColor: "#1C1D1F"
  },
  "Needs Revisions": {
    icon: "/images/status/needs-revision.svg",
    bgColor: "#FCE4E5",
    borderColor: "rgba(28, 29, 31, 0.05)", 
    textColor: "#1C1D1F"
  },
  "Revised": {
    icon: "/images/status/revised.svg",
    bgColor: "#FEEEE1",
    borderColor: "#F3E4D7",
    textColor: "#1C1D1F"
  },
  "Approved": {
    icon: "/images/status/approved.svg",
    bgColor: "#DDF9E4",
    borderColor: "rgba(28, 29, 31, 0.05)",
    textColor: "#1C1D1F"
  },
  "Scheduled": {
    icon: "/images/status/scheduled.svg",
    bgColor: "#F1F4F9",
    borderColor: "rgba(28, 29, 31, 0.05)",
    textColor: "#1C1D1F"
  },
  "Publishing": {
    icon: "/images/publish/publish.svg",
    bgColor: "#F1F4F9",
    borderColor: "rgba(28, 29, 31, 0.05)",
    textColor: "#1C1D1F"
  },
  "Published": {
    icon: "/images/status/published.svg",
    bgColor: "#E5EEFF",
    borderColor: "rgba(28, 29, 31, 0.05)",
    textColor: "#1C1D1F"
  },
  "Failed Publishing": {
    icon: "/images/status/failed-publishing.svg",
    bgColor: "#F5EEFF",
    borderColor: "#EAE4F4",
    textColor: "#1C1D1F"
  }
};

/**
 * A pill-style status indicator with icon and label
 */
export function StatusChip({
  status,
  widthFull = false,
}: {
  status: Status;
  widthFull?: boolean;
}) {
  const config = statusConfig[status] || {
    icon: "/images/status/draft.svg",
    bgColor: "#F1F4F9",
    borderColor: "rgba(28, 29, 31, 0.05)",
    textColor: "#1C1D1F"
  };

  return (
    <div
      style={{
        display: "inline-flex",
        padding: "2px 6px 2px 3px",
        alignItems: "center",
        gap: "4px",
        width: widthFull ? "100%" : "auto",
        borderRadius: "4px",
        border: `1px solid ${config.borderColor}`,
        backgroundColor: config.bgColor,
        color: config.textColor,
      }}
      className="text-xs font-medium whitespace-nowrap tracking-[-0.24px]"
    >
      <Image
        className='w-[16px] h-[16px]'
        src={config.icon}
        alt={status}
        width={16}
        height={16}
      />
      <span>{status}</span>
    </div>
  );
}

/* hex palette for the platform icons ----------------------------- */
const palette: Record<Platform, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  pinterest: '#E60023',
  youtube: '#FF0000',
  tiktok: '#000000',
  google: '#ff0000',
};

export const ChannelIcons = ({ 
  channels, 
  counts, 
  whiteBorder,
  size,
}: { 
  channels: Platform[]; 
  counts?: number; 
  whiteBorder?: boolean;
  size?: number;
}) => {
  const cts = counts ?? 0;
  const isWhiteBorder = whiteBorder ?? true;
  const iconSize = size ?? 18;
  const uniqueChannels = [...new Set(channels)];

  if (!uniqueChannels || uniqueChannels.length === 0) return null;
  
  return (  
    <div className="flex gap-1">
      {uniqueChannels?.map(platform => {
        const tint = (palette[platform] ?? '#888') + '1A';   // 10% alpha
        const n = cts;                     // 0 => hide badge
        return (
          <Tooltip key={platform} title={platform[0]?.toUpperCase() + platform.slice(1)}>
            <div
              className={`w-[${iconSize}px] h-[${iconSize}px] rounded-full flex items-center justify-center relative`}
              style={{
                // background: isWhiteBorder ? '#fff' : '',
                // border: isWhiteBorder ? "0.5px solid white" : '',
              }}
            >
              <Image
                src={`/images/platforms/${platform}.svg`}
                alt={platform}
                width={iconSize}
                height={iconSize}
              />
              {n > 1 && (
                <span className="absolute text-xs top-[-6px] right-[-1px] flex justify-center items-center leading-none rounded-full text-muted-foreground font-bold" style={{
                  background: '#D9D9D9',
                  width: "12px",
                  height: "12px",
                  fontSize: "8px",
                }}>
                  {`${n}`}
                </span>
              )}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

type FormatKind = "carousel" | "video" | "image" | "story" | "email" | "blog";

const formatConfig: Record<FormatKind, {
  background: string;
  label: string;
  hasBoxShadow: boolean;
}> = {
  "carousel": {
    background: "#E5EEFF",
    label: "Carousel",
    hasBoxShadow: true
  },
  "video": {
    background: "#F5EEFF",
    label: "Video",
    hasBoxShadow: true
  },
  "image": {
    background: "#DDF9E4",
    label: "Image",
    hasBoxShadow: true
  },
  "story": {
    background: "#FFE1CA",
    label: "Story",
    hasBoxShadow: true
  },
  "email": {
    background: "#FCE4E5",
    label: "Email",
    hasBoxShadow: false
  },
  "blog": {
    background: "#F1F4F9",
    label: "Blog",
    hasBoxShadow: false
  }
};

export function FormatBadge({
  kind,
  widthFull = false,
}: {
  kind?: string;
  widthFull: boolean;
}) {
  if (!kind) return null;
  // Default to static if kind not found
  const config = formatConfig[kind as FormatKind] || formatConfig["image"];
  const formatKey = kind;

  return (
    <div
      style={{
        display: "inline-flex",
        padding: "2px 8px 2px 3px",
        alignItems: "center",
        gap: "4px",
        borderRadius: "100px",
        border: "1px solid rgba(28, 29, 31, 0.05)",
        background: config.background,
        boxShadow: config.hasBoxShadow ? "0px 1px 2px -1px rgba(48, 51, 63, 0.02)" : undefined,
        width: widthFull ? "100%" : "auto",
        justifyContent: 'center',
      }}
      className="text-xs font-medium"
    >
      <Image 
        src={`/images/format/${formatKey}.svg`}
        alt={config.label}
        width={16}
        height={16}
      />
      <span style={{
        color: "#1C1D1F"
      }} className="flex justify-center items-center tracking-[-0.24px]">
        {config.label}
      </span>
    </div>
  );
}
