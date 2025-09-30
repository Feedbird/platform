import { ServiceChannel } from "@/lib/supabase/client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Checkbox } from "../ui/checkbox";

type ChannelSelectProps = {
  channels: ServiceChannel[];
};

export default function MultiSelectDropdown({ channels }: ChannelSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(
    channels.filter((c) => c.default).map((c) => c.id)
  );
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update button position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border-1 border-[#D3D3D3] rounded-[6px] text-[13px] px-3 py-2 h-9 text-left bg-white hover:cursor-pointer focus:outline-none flex justify-between items-center"
      >
        <span>
          {selected.length > 1
            ? `${selected.length} selected`
            : "Select socials"}
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
                  onClick={(e) => toggleOption(channel.id)}
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
                      checked={selected.includes(channel.id)}
                      onClick={() => toggleOption(channel.id)}
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
