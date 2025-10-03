import { ChevronRight } from "lucide-react";
import React from "react";
import { Input } from "../ui/input";

type Props = {
  emailSetter: React.Dispatch<React.SetStateAction<string>>;
  email: string;
};

export default function EmailInput({ emailSetter, email }: Props) {
  const [editing, setEditing] = React.useState(true);

  return (
    <div className="flex w-full flex-col gap-4 rounded-[8px] border-1 border-[#E2E2E4] bg-white px-5 py-4">
      {editing ? (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-[13px] font-medium text-[#1C1D1F]">
                Your email address
              </span>
              <ChevronRight width={16} height={16} />
            </div>
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (email.length > 0) {
                    setEditing(false);
                  }
                }
              }}
              value={email}
              onChange={(e) => {
                emailSetter(e.target.value);
              }}
              className="h-[42px] rounded-[6px] border-1 border-[#C8C9CB] px-4 py-3 text-[#1C1D1F]"
              placeholder="name@example.com"
            />
          </div>
          <p className="text-xs font-normal text-[#1C1D1F]">
            You’ll be able to change notification settings for Nord services
            marketing emails in your Nord Account.
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-1 text-sm">
          <label className="text-[13px] text-[#838488] font-normal">
            Your email address
          </label>
          <div className="flex justify-between items-center font-medium">
            <span className="text-[#1C1D1F]">{email}</span>
            <span
              onClick={() => setEditing(true)}
              className="text-[#4670F9] hover:cursor-pointer hover:underline"
            >
              Edit
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
