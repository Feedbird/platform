import { ServiceChannel } from "@/lib/supabase/client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Checkbox } from "../ui/checkbox";

type ChannelSelectProps = {
  channels: ServiceChannel[];
  channelsSelected: ServiceChannel[];
  selectChannels: React.Dispatch<React.SetStateAction<ServiceChannel[]>>;
};

export default function MultiSelectDropdown({
  channels,
  channelsSelected,
  selectChannels,
}: ChannelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update button position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  // Close when clicking outside or scrolling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true); // Use capture to catch all scroll events

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const toggleOption = (channel: ServiceChannel) => {
    const isSelected = channelsSelected.find((c) => c.id === channel.id);
    if (isSelected) {
      selectChannels((prev) => prev.filter((c) => c.id !== channel.id));
    } else {
      selectChannels((prev) => [...prev, channel]);
    }
  };

  const defaultChannel = channels.find((c) => c.default);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-1 border-[#D3D3D3] rounded-[6px] text-[13px] px-3 py-2 h-9 text-left bg-white hover:cursor-pointer focus:outline-none flex justify-between items-center"
      >
        <span>
          {channelsSelected.length > 1 ? (
            `${channelsSelected.length} selected`
          ) : (
            <div className="flex items-center gap-2">
              <Image
                src={`/images/checkout/channels/${
                  defaultChannel!.social_channel
                }.svg`}
                alt="social_channel_icon"
                width={18}
                height={18}
              />
              <span className="text-[#1C1D1F] font-medium">
                {defaultChannel!.social_channel
                  .slice(0, 1)
                  .toLocaleUpperCase() +
                  defaultChannel!.social_channel.slice(1)}
              </span>
            </div>
          )}
        </span>
        {!isOpen ? (
          <ChevronDownIcon width={16} height={16} color="#060A13" />
        ) : (
          <ChevronUpIcon width={16} height={16} color="#060A13" />
        )}
      </button>

      {isOpen &&
        buttonRect &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed bg-white border rounded-md shadow-lg z-[9999]"
            style={{
              top: buttonRect.bottom + 4,
              left: buttonRect.left,
              width: buttonRect.width,
            }}
          >
            <ul className="max-h-60 overflow-y-auto p-1">
              {channels.map((channel) => (
                <li
                  key={channel.id}
                  onClick={() => toggleOption(channel)}
                  className="px-2 py-1.5 flex rounded-sm justify-between items-center hover:bg-gray-50 cursor-pointer text-[13px]"
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src={`/images/checkout/channels/${channel.social_channel}.svg`}
                      alt="social_channel_icon"
                      width={18}
                      height={18}
                    />
                    <span className="text-[#1C1D1F] font-medium">
                      {channel.social_channel.slice(0, 1).toLocaleUpperCase() +
                        channel.social_channel.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={` ${
                        channel.default
                          ? "text-[#03985C] font-normal"
                          : "text-[#838488] font-normal"
                      }`}
                    >
                      {channel.default ? "Free" : `$${channel.pricing}`}
                    </span>
                    <Checkbox
                      checked={
                        channelsSelected.find((c) => c.id === channel.id) !==
                        undefined
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(channel);
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
}
