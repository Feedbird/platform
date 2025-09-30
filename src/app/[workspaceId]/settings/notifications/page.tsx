"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { userApi } from "@/lib/api/api-service";

export default function SettingsNotificationsPage() {
  const user = useFeedbirdStore((s) => s.user);
  const activeWorkspace = useFeedbirdStore((s) => s.getActiveWorkspace());
  const updateUserNotificationSettings = useFeedbirdStore((s) => s.updateUserNotificationSettings);

  const [notificationSettings, setNotificationSettings] = useState({
    communication: {
      enabled: false,
      commentsAndMentions: false,
    },
    boards: {
      enabled: false,
      pendingApproval: false,
      scheduled: false,
      published: false,
      boardInviteSent: false,
      boardInviteAccepted: false,
    },
    workspaces: {
      enabled: false,
      workspaceInviteSent: false,
      workspaceInviteAccepted: false,
    },
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Initialize settings from store when user data changes
  useEffect(() => {
    if (user?.notification_settings) {
        console.log(user.notification_settings)
      //setNotificationSettings(user.notification_settings);
    }
  }, [user?.notification_settings]);

  const persistSettings = async (nextSettings: typeof notificationSettings) => {
    if (!user?.email || !activeWorkspace?.id) return;
    try {
      setIsSavingSettings(true);
      const updatedUser = await userApi.updateNotificationSettings(
        user.email,
        nextSettings
      );
      if (updatedUser?.notification_settings) {
        updateUserNotificationSettings(updatedUser.notification_settings);
      }
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!user?.email) return;
    try {
      setIsSavingSettings(true);
      const updatedUser = await userApi.updateNotificationSettings(
        user.email,
        notificationSettings
      );
      if (updatedUser?.notification_settings) {
        updateUserNotificationSettings(updatedUser.notification_settings);
      }
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-4">
      {/* Topbar */}
      <div className="w-full border-b px-4 h-10 flex items-center justify-between">
        <div className="text-sm text-grey font-medium">Notifications</div>
      </div>

      {/* Main */}
      <div className="w-full pt-2 flex flex-1 items-start justify-center overflow-y-auto">
        <div className="w-[512px]">
          {/* Section header */}
          <div className="border-b border-elementStroke pb-4">
            <div className="text-sm text-black font-medium">Notifications</div>
          </div>

          {/* Communication Section */}
          <div className="space-y-3 pb-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-normal text-darkGrey">Communication</h3>
              <Switch
                checked={notificationSettings.communication.enabled}
                onCheckedChange={(checked) => {
                  const next = {
                    ...notificationSettings,
                    communication: {
                      enabled: checked,
                      commentsAndMentions: checked ? notificationSettings.communication.commentsAndMentions : false,
                    },
                  };
                  setNotificationSettings(next);
                  persistSettings(next);
                }}
                className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-black">Comment, mentions, replies (in boards)</span>
                <Switch
                  checked={notificationSettings.communication.enabled && notificationSettings.communication.commentsAndMentions}
                  disabled={!notificationSettings.communication.enabled}
                  onCheckedChange={(checked) => {
                    const next = {
                      ...notificationSettings,
                      communication: { ...notificationSettings.communication, commentsAndMentions: checked },
                    };
                    setNotificationSettings(next);
                    persistSettings(next);
                  }}
                  className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Boards Section */}
          <div className="space-y-3 py-4 border-y border-elementStroke">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-normal text-darkGrey">Boards</h3>
              <Switch
                checked={notificationSettings.boards.enabled}
                onCheckedChange={(checked) => {
                  const next = {
                    ...notificationSettings,
                    boards: {
                      enabled: checked,
                      pendingApproval: checked ? notificationSettings.boards.pendingApproval : false,
                      scheduled: checked ? notificationSettings.boards.scheduled : false,
                      published: checked ? notificationSettings.boards.published : false,
                      boardInviteSent: checked ? notificationSettings.boards.boardInviteSent : false,
                      boardInviteAccepted: checked ? notificationSettings.boards.boardInviteAccepted : false,
                    },
                  };
                  setNotificationSettings(next);
                  persistSettings(next);
                }}
                className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-black">Records 'Pending Approval'</span>
                <Switch
                  checked={notificationSettings.boards.enabled && notificationSettings.boards.pendingApproval}
                  disabled={!notificationSettings.boards.enabled}
                  onCheckedChange={(checked) => {
                    const next = {
                      ...notificationSettings,
                      boards: { ...notificationSettings.boards, pendingApproval: checked },
                    };
                    setNotificationSettings(next);
                    persistSettings(next);
                  }}
                  className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-black">Records 'Scheduled'</span>
                <Switch
                  checked={notificationSettings.boards.enabled && notificationSettings.boards.scheduled}
                  disabled={!notificationSettings.boards.enabled}
                  onCheckedChange={(checked) => {
                    const next = {
                      ...notificationSettings,
                      boards: { ...notificationSettings.boards, scheduled: checked },
                    };
                    setNotificationSettings(next);
                    persistSettings(next);
                  }}
                  className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-black">Records 'Published'</span>
                <Switch
                  checked={notificationSettings.boards.enabled && notificationSettings.boards.published}
                  disabled={!notificationSettings.boards.enabled}
                  onCheckedChange={(checked) => {
                    const next = {
                      ...notificationSettings,
                      boards: { ...notificationSettings.boards, published: checked },
                    };
                    setNotificationSettings(next);
                    persistSettings(next);
                  }}
                  className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-black">Board invite sent</span>
                <Switch
                  checked={notificationSettings.boards.enabled && notificationSettings.boards.boardInviteSent}
                  disabled={!notificationSettings.boards.enabled}
                  onCheckedChange={(checked) => {
                    const next = {
                      ...notificationSettings,
                      boards: { ...notificationSettings.boards, boardInviteSent: checked },
                    };
                    setNotificationSettings(next);
                    persistSettings(next);
                  }}
                  className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-black">Board invite accepted</span>
                <Switch
                  checked={notificationSettings.boards.enabled && notificationSettings.boards.boardInviteAccepted}
                  disabled={!notificationSettings.boards.enabled}
                  onCheckedChange={(checked) => {
                    const next = {
                      ...notificationSettings,
                      boards: { ...notificationSettings.boards, boardInviteAccepted: checked },
                    };
                    setNotificationSettings(next);
                    persistSettings(next);
                  }}
                  className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Workspaces Section */}
          <div className="space-y-3 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-normal text-darkGrey">Workspaces</h3>
              <Switch
                checked={notificationSettings.workspaces.enabled}
                onCheckedChange={(checked) => {
                  const next = {
                    ...notificationSettings,
                    workspaces: {
                      enabled: checked,
                      workspaceInviteSent: checked ? notificationSettings.workspaces.workspaceInviteSent : false,
                      workspaceInviteAccepted: checked ? notificationSettings.workspaces.workspaceInviteAccepted : false,
                    },
                  };
                  setNotificationSettings(next);
                  persistSettings(next);
                }}
                className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-black">Workspace invite sent</span>
                <Switch
                  checked={notificationSettings.workspaces.enabled && notificationSettings.workspaces.workspaceInviteSent}
                  disabled={!notificationSettings.workspaces.enabled}
                  onCheckedChange={(checked) => {
                    const next = {
                      ...notificationSettings,
                      workspaces: { ...notificationSettings.workspaces, workspaceInviteSent: checked },
                    };
                    setNotificationSettings(next);
                    persistSettings(next);
                  }}
                  className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-black">Workspace invite accepted</span>
                <Switch
                  checked={notificationSettings.workspaces.enabled && notificationSettings.workspaces.workspaceInviteAccepted}
                  disabled={!notificationSettings.workspaces.enabled}
                  onCheckedChange={(checked) => {
                    const next = {
                      ...notificationSettings,
                      workspaces: { ...notificationSettings.workspaces, workspaceInviteAccepted: checked },
                    };
                    setNotificationSettings(next);
                    persistSettings(next);
                  }}
                  className="h-3.5 w-6 rounded-full data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}