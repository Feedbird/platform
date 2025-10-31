import { TrashIcon, Upload } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

type Props = {
  image: File | null;
  imageHandler: (file: File | null) => void;
};

export default function ImageUpload({ imageHandler, image }: Props) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      imageHandler(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      imageHandler(selectedFile);
    }
  };

  return (
    <div>
      <div
        onClick={handleFileClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex w-full justify-center rounded-[6px] border-1 border-dashed border-[#D3D3D3] bg-white p-4.5 transition-colors hover:cursor-pointer hover:bg-[#EDF6FF]`}
      >
        {image && (
          <div
            className="absolute top-1 right-1 z-20 rounded-sm p-1 hover:bg-[#e2f0ff]"
            onClick={(e) => {
              e.stopPropagation();
              imageHandler(null);
            }}
          >
            <TrashIcon color="red" size={14} />
          </div>
        )}
        <div className="flex flex-col items-center gap-1">
          {image ? (
            <div className="flex max-h-32 w-full gap-12">
              <div className="h-32">
                <Image
                  src={URL.createObjectURL(image)}
                  alt="Uploaded Image"
                  width={64}
                  height={64}
                  className="h-full w-full rounded-[6px]"
                />
              </div>
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-1 border-[#4670F9] bg-[#EDF6FF] p-2">
                  <Upload />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#4670F9]">
                    {image.name}
                  </p>
                  <p className="text-xs font-normal text-[#5C5E63]">
                    Click to change file
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-1 border-[#D3D3D3] p-2">
                <Upload />
              </div>
              <div className="flex flex-row gap-1">
                <span className="text-sm font-semibold text-[#4670F9] hover:underline">
                  Click to upload
                </span>
                <p className="text-sm font-normal text-[#5C5E63]">
                  or drag and drop
                </p>
              </div>
              <p className="text-sm font-normal text-[#5C5E63]">
                SVG, PNG, JPG
              </p>
            </>
          )}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
