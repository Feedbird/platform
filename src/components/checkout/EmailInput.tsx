import { ChevronRight } from "lucide-react";
import React from "react";
import { Input } from "../ui/input";
import { useUserStore } from "@/lib/store";
import { workspaceApi } from "@/lib/api/api-service";

type Props = {
  emailSetter: React.Dispatch<React.SetStateAction<string>>;
  setWorkspace: React.Dispatch<React.SetStateAction<string | null>>;
  email: string;
};

export default function EmailInput({ emailSetter, email }: Props) {
  const { user } = useUserStore();
  const [editing, setEditing] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (user && user.email) {
      setEditing(false);
      emailSetter(user.email);
    }
  }, [user]);

  const validateEmail = React.useCallback((email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  }, []);

  const fetchMember = async (email: string) => {
    try {
      // TODO This should be a call to a single member fetch instead of a list
      const member = await workspaceApi;
    } catch (e) {}
  };

  const handleEnter = () => {
    if (email.length) {
      if (validateEmail(email)) {
        setError("");
        setEditing(false);
      } else {
        setError("Please enter a valid email address");
      }
    } else setError("Email address is required");
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-[8px] border-1 border-[#E2E2E4] bg-white px-5 py-4">
      {editing ? (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between">
              <span className="text-[13px] font-medium text-black">
                Your email address
              </span>
              <ChevronRight width={16} height={16} />
            </div>
            <Input
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEnter();
                }
              }}
              value={email}
              onChange={(e) => {
                emailSetter(e.target.value);
              }}
              className="h-[42px] rounded-[6px] border-1 border-[#C8C9CB] px-4 py-3 text-black"
              placeholder="name@example.com"
            />
            <p className="text-xs font-normal text-red-500">{error}</p>
          </div>
          <p className="text-xs font-normal text-black">
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
            <span className="text-black">{email}</span>
            {!user && (
              <span
                onClick={() => setEditing(true)}
                className="text-[#4670F9] hover:cursor-pointer hover:underline"
              >
                Edit
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
