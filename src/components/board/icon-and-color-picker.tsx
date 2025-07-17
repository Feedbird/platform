import * as React from 'react';
import { Check, Upload, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { defaultIcons, defaultColors } from '@/lib/store/use-feedbird-store';

interface IconAndColorPickerProps {
  selectedIcon: string | undefined;
  onSelectIcon: (icon: string) => void;
  selectedColor: string | undefined;
  onSelectColor: (color: string) => void;
}

// Function to get border color for selected color
const getBorderColor = (color: string) => {
  const colorMap: Record<string, string> = {
    "#125AFF": "#88C3FF",
    "#7D68D5": "#B8A5E8",
    "#349DFE": "#7BC4FE",
    "#3FAFA0": "#7FD4C8",
    "#39CAFF": "#7DD9FF",
    "#FFCB57": "#FFE0A3",
    "#F87934": "#FBB07A",
    "#E85E62": "#F4A5A8",
    "#EC5690": "#F5A3C2",
    "#B45FC1": "#D4A3D8",
    "#FB8AEE": "#FDC5F4",
    "#AC8E81": "#D4C2BB",
    "#1C1C1C": "#666666",
    "#97A7A6": "#C7D1D0",
    "#5374E0": "#9BA8F0",
    "#E6E4E2": "#F2F0EE"
  };
  return colorMap[color] || "#88C3FF";
};

export function IconAndColorPicker({ selectedIcon, onSelectIcon, selectedColor, onSelectColor }: IconAndColorPickerProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Remove the problematic useEffect that automatically sets color
  // React.useEffect(() => {
  //   if (!selectedColor) {
  //     onSelectColor("#125AFF");
  //   }
  // }, [selectedColor, onSelectColor]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Convert file to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onSelectIcon(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col pt-1 pb-3 justify-center rounded-[6px] gap-1.5" style={{boxShadow: "0px 1px 2px -1px rgba(7,10,22,0.02)"}}>
      {/* Icons Section */}
      <div className="px-3">
        <p className="py-[6px] text-[#838488] font-medium text-sm">Icons</p>
        <div className="grid grid-cols-8 gap-[10px]">
          {defaultIcons.map(icon => (
            <button
              key={icon}
              onClick={() => onSelectIcon(icon)}
              className="w-4 h-4 rounded flex items-center justify-center relative transition-all cursor-pointer hover:scale-110"
              style={{
                backgroundColor: selectedIcon === icon ? selectedColor : 'transparent',
              }}
            >
              <img 
                src={icon} 
                alt={icon.split('/').pop()?.split('.')[0]} 
                className={cn(
                  "w-3.5 h-3.5 m-0.5 transition-all",
                  selectedIcon === icon && selectedColor && selectedColor !== "#FFFFFF" && "filter brightness-0 invert" // Makes icon white when selected and there's a colored background
                )}
              />
            </button>
          ))}
        </div>
        
        {/* Upload Icon Button */}
        <button
          onClick={handleUploadClick}
          className="mt-2.5 w-full flex items-center justify-center gap-1 py-1 pl-1.5 pr-2 rounded-[6px] border border-[#D3D3D3] bg-white hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#5C5E63]" />
          <span className="text-sm font-medium text-[#5C5E63]">Upload Icon</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Board Colors Section */}
      <div className='px-3'>
        <p className="py-1.5 text-[#838488] font-medium text-sm">Board color</p>
        <div className="grid grid-cols-8 gap-[10px]">
          {defaultColors.map(color => (
            <button
              key={color}
              onClick={() => onSelectColor(color)}
              className={cn(
                'w-3.5 h-3.5 m-0.5 rounded-full flex items-center justify-center transition-all hover:scale-110 cursor-pointer',
                selectedColor === color && 'ring-2 ring-offset-1 ring-[color:var(--selected-color-border)]'
              )}
              style={{ 
                backgroundColor: color,
                ...(selectedColor === color
                  ? { '--selected-color-border': getBorderColor(color) } as React.CSSProperties
                  : {})
              }}
            >
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
