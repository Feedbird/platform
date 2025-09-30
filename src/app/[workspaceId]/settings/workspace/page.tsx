"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimezonePicker } from "@/components/ui/timezone-picker";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useImageUploader } from "@/hooks/use-image-uploader";
import { Trash2, Upload, X, Plus } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useFeedbirdStore } from "@/lib/store/use-feedbird-store";
import { workspaceApi, storeApi } from "@/lib/api/api-service";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

type DaySlot = { start?: string; end?: string };

type DefaultBoardRules = {
  autoSchedule: boolean;
  revisionRules: boolean;
  approvalDeadline: boolean;
  groupBy: string | null;
  sortBy: string | null;
  rowHeight: string | null;
  firstMonth?: number; // -1 for Unlimited
  ongoingMonth?: number; // -1 for Unlimited
  approvalDays?: number; // 7,14,30,60
  approvalCustom?: string; // custom days as string
};

export default function SettingsWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [loading, setLoading] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [ws, setWs] = React.useState<any | null>(null);

  // form state
  const [logo, setLogo] = React.useState<string | "">("");
  const [name, setName] = React.useState("");
  const [timezone, setTimezone] = React.useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [weekStart, setWeekStart] = React.useState<"monday" | "sunday">("monday");
  const [timeFormat, setTimeFormat] = React.useState<"24h" | "12h">("24h");
  const [allowedSlots, setAllowedSlots] = React.useState<Partial<Record<typeof WEEKDAYS[number], DaySlot>>>({});
  const [rules, setRules] = React.useState<DefaultBoardRules>({
    autoSchedule: true,
    revisionRules: true,
    approvalDeadline: true,
    groupBy: "month",
    sortBy: "status",
    rowHeight: "Large",
  });

  const [confirmName, setConfirmName] = React.useState("");

  const { upload, uploading } = useImageUploader({ workspaceId, resource: [{ type: "workspaces", id: workspaceId }, { type: "logos" }] });

  const wsLogoInput = React.useRef<HTMLInputElement | null>(null);

  const storeWorkspace = useFeedbirdStore((s) => s.workspaces.find((w) => w.id === workspaceId));

  React.useEffect(() => {
    if (!storeWorkspace) return;
    setWs(storeWorkspace);
    setLogo(storeWorkspace.logo || "");
    setName(storeWorkspace.name || "");
    console.log("storeWorkspace", storeWorkspace);
    if ((storeWorkspace as any).timezone) setTimezone((storeWorkspace as any).timezone);
    if ((storeWorkspace as any).week_start) setWeekStart((storeWorkspace as any).week_start);
    if ((storeWorkspace as any).time_format) setTimeFormat((storeWorkspace as any).time_format);
    if ((storeWorkspace as any).allowed_posting_time) setAllowedSlots((storeWorkspace as any).allowed_posting_time);
    const dbr = (storeWorkspace as any).default_board_rules;
    if (dbr) setRules({
      autoSchedule: !!dbr.autoSchedule,
      revisionRules: !!dbr.revisionRules,
      approvalDeadline: !!dbr.approvalDeadline,
      groupBy: dbr.groupBy ?? null,
      sortBy: dbr.sortBy ?? null,
      rowHeight: dbr.rowHeight ?? null,
      firstMonth: typeof dbr.firstMonth === 'number' ? dbr.firstMonth : undefined,
      ongoingMonth: typeof dbr.ongoingMonth === 'number' ? dbr.ongoingMonth : undefined,
      approvalDays: typeof dbr.approvalDays === 'number' ? dbr.approvalDays : undefined,
      approvalCustom: typeof dbr.approvalCustom === 'string' ? dbr.approvalCustom : undefined,
    });
  }, [storeWorkspace]);

  async function handleUploadLogo(file: File) {
    const url = await upload(file);
    if (url) setLogo(url);
  }

  async function handleRemoveLogo() {
    setLogo("");
  }

  async function handleSave() {
    if (!ws) return;
    setLoading(true);
    try {
      const updated = await workspaceApi.updateWorkspace(ws.id, {
        name,
        logo,
        timezone,
        week_start: weekStart,
        time_format: timeFormat,
        allowed_posting_time: allowedSlots,
        default_board_rules: rules,
      });
      useFeedbirdStore.setState((s) => ({
        workspaces: s.workspaces.map((w) => (w.id === ws.id ? {
          ...w,
          name,
          logo,
          timezone,
          week_start: weekStart,
          time_format: timeFormat,
          allowed_posting_time: allowedSlots,
          default_board_rules: rules,
        } : w)),
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!ws) return;
    setLoading(true);
    try {
      await storeApi.deleteWorkspaceAndUpdateStore(ws.id);
      setOpenDelete(false);
      router.push("/");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Topbar */}
      <div className="w-full border-b px-4 h-10 flex items-center justify-between">
        <div className="text-sm text-grey font-medium">Workspace</div>
      </div>

      {/* Main */}
      <div className="w-full p-6 flex flex-1 items-start justify-center overflow-y-auto">
        <div className="w-[512px] space-y-6">
          {/* Section header */}
          <div className="border-b border-elementStroke pb-4">
            <div className="text-sm text-black font-medium">Workspace</div>
          </div>

          {/* Logo + Upload */}
          <div className="flex gap-8 items-center">
            <div className="flex items-center gap-4">
              {logo ? (
                <div className="relative size-12 rounded-[6px] overflow-hidden border-1 border-elementStroke">
                  <Image src={logo} alt="logo" fill className="object-cover" />
                </div>
              ) : (
                <div className="size-12 rounded-[6px] border-1 border-elementStroke flex items-center justify-center">
                  <img src='/images/icons/workspace.svg' className='w-5 h-5' />
                </div>
              )}
              {/* Center - Text information */}
              <div className="flex-1 items-center justify-center">
                <div className="text-base font-medium text-black">Workspace Avatar</div>
                <div className="text-xs font-normal text-grey mt-1">Min. 200×200px, PNG or JPG</div>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div onClick={handleRemoveLogo}
                className={cn(
                  'text-sm text-[#D82A2A] font-medium cursor-pointer',
                  !!logo ? 'opacity-100' : 'opacity-30'
                )}
              >
                Remove photo
              </div>

              <label className="inline-flex">
                <input
                  type="file"
                  accept="image/*"
                  ref={wsLogoInput}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadLogo(f);
                  }}
                />
                <Button onClick={() => wsLogoInput.current?.click()} size="sm" asChild={false} disabled={uploading} className="px-3 py-1.5 text-sm text-black font-semibold rounded-sm bg-backgroundHover hover:bg-backgroundHover/70 cursor-pointer">
                  <span className="items-center">{uploading ? "Uploading..." : "Upload"}</span>
                </Button>
              </label>
            </div>
          </div>

          {/* Name */}
          <div className="grid gap-2 w-full">
            <Label htmlFor="ws-name" className="text-sm text-grey font-normal">Workspace name</Label>
            <Input id="ws-name" className="text-sm text-black font-normal border-strokeButton rounded-[6px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter workspace name" />
          </div>

          {/* Timezone */}
          <div className="grid gap-2 w-full">
            <Label className="text-sm text-grey font-normal">Workspace timezone</Label>
            <div className="w-full border border-strokeButton rounded-[6px] text-sm text-black font-normal">
              <TimezonePicker value={timezone} onChange={setTimezone} />
            </div>
          </div>

          {/* Week start and Time format */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="text-sm font-normal text-grey mb-2">Start of week</div>
              <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-[30px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekStart('monday')}
                  className={`px-[8px] text-black rounded-[6px] font-medium text-sm h-7 flex-1 cursor-pointer ${weekStart === 'monday' ? 'bg-white shadow hover:bg-white' : ''
                    }`}
                >
                  Monday
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWeekStart('sunday')}
                  className={`px-[8px] text-black rounded-[6px] font-medium text-sm h-7 flex-1 cursor-pointer ${weekStart === 'sunday' ? 'bg-white shadow hover:bg-white' : ''
                    }`}
                >
                  Sunday
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-normal text-grey mb-2">Time format</div>
              <div className="flex items-center gap-[4px] p-[2px] bg-[#F4F5F6] rounded-[6px] h-[30px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeFormat('24h')}
                  className={`px-[8px] text-black rounded-[6px] font-medium text-sm h-7 flex-1 cursor-pointer ${timeFormat === '24h' ? 'bg-white shadow hover:bg-white' : ''
                    }`}
                >
                  24-hour
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimeFormat('12h')}
                  className={`px-[8px] text-black rounded-[6px] font-medium text-sm h-7 flex-1 cursor-pointer ${timeFormat === '12h' ? 'bg-white shadow hover:bg-white' : ''
                    }`}
                >
                  12-hour
                </Button>
              </div>
            </div>
          </div>

          {/* Allowed Posting Time – inline slot items per weekday */}
          <div className="space-y-2">
            <Label className="text-sm text-black font-medium">Allowed Posting Time</Label>
            <div className="text-sm font-normal text-grey">When using the ‘auto-schedule’ feature, this is where you set the allowed times of when posts are allowed to be scheduled.</div>
            <div className="flex flex-col gap-2 pr-1 w-full mt-2">
              {WEEKDAYS.map((day) => {
                const slot = (allowedSlots as any)[day] || {} as DaySlot;
                const has = !!slot.start && !!slot.end;

                return (
                  <div key={day} className="flex items-center gap-3 min-h-10 w-full">
                    <div className={cn("flex justify-center items-center text-white text-xs font-semibold w-6 h-6 rounded-full", has ? "bg-[#125AFF]" : "bg-[#838488]")}>{day[0]}</div>
                    {has ? (
                      <div className="flex-1 w-full min-w-0 flex items-center gap-1">
                        <Select value={slot.start} onValueChange={(v) => setAllowedSlots((prev) => ({ ...prev, [day]: { ...(prev as any)[day], start: v } }))}>
                          <SelectTrigger className="h-8 text-xs border rounded px-1 w-full flex-1"><SelectValue placeholder="Start" /></SelectTrigger>
                          <SelectContent className="max-h-40 overflow-y-auto">
                            {generateTimeOptions().map((t) => (<SelectItem key={t} value={t} className="text-xs h-7">{t}</SelectItem>))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs">-</span>
                        <Select value={slot.end} onValueChange={(v) => setAllowedSlots((prev) => ({ ...prev, [day]: { ...(prev as any)[day], end: v } }))}>
                          <SelectTrigger className="h-8 text-xs border rounded px-1 w-full flex-1"><SelectValue placeholder="End" /></SelectTrigger>
                          <SelectContent className="max-h-40 overflow-y-auto">
                            {generateTimeOptions().map((t) => (<SelectItem key={t} value={t} className="text-xs h-7">{t}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="text-xs text-[#5C5E63] flex-1">No time is set yet</div>
                    )}
                    <button
                      className="ml-auto"
                      style={{
                        display: "flex",
                        width: "16px",
                        height: "16px",
                        padding: "2px",
                        justifyContent: "center",
                        alignItems: "center",
                        aspectRatio: "1/1",
                        borderRadius: "4px",
                        border: "1px solid #E6E4E2",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        if (has) {
                          setAllowedSlots((prev) => ({ ...prev, [day]: {} } as any));
                        } else {
                          setAllowedSlots((prev) => ({ ...prev, [day]: { start: "09:00", end: "17:00" } } as any));
                        }
                      }}
                    >
                      {has ? (
                        <X size={12} className="text-[#5C5E63]" />
                      ) : (
                        <Plus size={12} className="text-[#5C5E63]" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Default Board Settings */}
          <div className="space-y-4">
            <div className="text-sm text-black font-medium">Default Board Settings</div>
            <div className="flex flex-col gap-4">
              {/* Auto-schedule styled like board-rules-modal */}
              <div className={[
                "p-3 rounded-md",
                "shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)]",
                "shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)]",
                "shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)]",
                "border",
                rules.autoSchedule ? "border-[#125AFF]" : "border-[#D3D3D3]",
                "flex justify-between items-center gap-2 bg-white"
              ].join(" ")}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 relative overflow-hidden">
                      <img src="/images/boards/stars-01.svg" className="rounded-sm" alt="auto-schedule" />
                    </div>
                    <div className="text-sm font-medium text-black leading-none">Auto-schedule</div>
                  </div>
                  <div className="flex items-center text-[13px] text-[#75777C] leading-tight">
                    Automatically plan content based on your set rules and timeline.
                  </div>
                </div>
                <Switch
                  checked={rules.autoSchedule}
                  onCheckedChange={(v) => setRules(r => ({ ...r, autoSchedule: !!v }))}
                  className="h-3.5 w-6 data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
                  icon={
                    <span className="flex items-center justify-center w-full h-full">
                      <img
                        src="/images/boards/stars-01.svg"
                        alt="star"
                        className="w-2.5 h-2.5"
                        style={{ filter: rules.autoSchedule ? undefined : 'grayscale(2) brightness(0.85)' }}
                      />
                    </span>
                  }
                />
              </div>

              {/* Add revision rules styled like board-rules-modal */}
              <div className="p-3 rounded-md shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)] shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)] shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)] border flex flex-col gap-4 bg-white" style={{ borderColor: rules.revisionRules ? '#125AFF' : '#D3D3D3' }}>
                <div className="flex justify-between items-center">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-sm font-medium text-black leading-none">Add revision rules</span>
                    <span className="text-[13px] text-[#75777C] leading-tight">Customize how content is reviewed and approved over time.</span>
                  </div>
                  <Switch
                    checked={rules.revisionRules}
                    onCheckedChange={(v) => setRules(r => ({ ...r, revisionRules: !!v }))}
                    className="h-3.5 w-6 data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
                  />
                </div>
                {rules.revisionRules && (
                  <div className="w-full flex flex-col md:flex-row gap-4 mt-1">
                    <div className="flex-1 flex flex-col gap-2">
                      <span className="text-[13px] font-medium text-black leading-none">First month</span>
                      <Select
                        value={typeof rules.firstMonth === 'number' ? (rules.firstMonth === -1 ? 'Unlimited' : String(rules.firstMonth)) : ''}
                        onValueChange={(val) => setRules(r => ({ ...r, firstMonth: val === 'Unlimited' ? -1 : Number(val) }))}
                      >
                        <SelectTrigger className="w-full px-2.5 py-2 text-[13px] bg-white rounded-md border border-[#D3D3D3] text-left">
                          <SelectValue placeholder="Select how many revision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="Unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <span className="text-[13px] font-medium text-black leading-none">Ongoing months</span>
                      <Select
                        value={typeof rules.ongoingMonth === 'number' ? (rules.ongoingMonth === -1 ? 'Unlimited' : String(rules.ongoingMonth)) : ''}
                        onValueChange={(val) => setRules(r => ({ ...r, ongoingMonth: val === 'Unlimited' ? -1 : Number(val) }))}
                      >
                        <SelectTrigger className="w-full px-2.5 py-2 text-[13px] bg-white rounded-md border border-[#D3D3D3] text-left">
                          <SelectValue placeholder="Select how many revision" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="Unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Approval deadline styled like board-rules-modal */}
              <div className={[
                "p-3 rounded-md",
                "shadow-[0px_2px_2px_-1px_rgba(7,10,22,0.06)]",
                "shadow-[0px_1px_2px_-1px_rgba(7,10,22,0.02)]",
                "shadow-[0px_0px_1px_0px_rgba(224,224,224,1.00)]",
                "border",
                rules.approvalDeadline ? "border-[#125AFF]" : "border-[#D3D3D3]",
                "flex flex-col gap-3 bg-white"
              ].join(" ")}
              >
                <div className="w-full flex justify-between items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="text-sm font-medium text-black leading-none">Approval deadline</div>
                    <div className="h-5 flex items-center text-[13px] text-[#75777C] leading-tight">
                      Customize how content is reviewed and approved over time.
                    </div>
                  </div>
                  <Switch
                    checked={rules.approvalDeadline}
                    onCheckedChange={(v) => setRules(r => ({ ...r, approvalDeadline: !!v }))}
                    className="h-3.5 w-6 data-[state=checked]:bg-[#125AFF] data-[state=unchecked]:bg-[#D3D3D3] cursor-pointer [&_[data-slot=switch-thumb]]:h-3 [&_[data-slot=switch-thumb]]:w-3"
                  />
                </div>
                {rules.approvalDeadline && (
                  <>
                    <div className="w-full flex flex-wrap gap-2">
                      {['7', '14', '30', '60', 'custom'].map(opt => {
                        const isCustom = opt === 'custom';
                        const selected = isCustom ? rules.approvalDays === undefined : rules.approvalDays === Number(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setRules(r => ({ ...r, approvalDays: isCustom ? undefined : Number(opt) }))}
                            className={cn(
                              "flex-1 h-8 px-3 rounded-full border outline outline-1 outline-offset-[-1px] text-[13px] font-medium cursor-pointer",
                              selected ? 'bg-blue-600 text-white outline-blue-600' : 'bg-white text-black outline-slate-300'
                            )}
                          >
                            {isCustom ? 'Custom' : `${opt} days`}
                          </button>
                        );
                      })}
                    </div>
                    {rules.approvalDays === undefined && (
                      <div className="w-full mt-1">
                        <input
                          type="number"
                          min={0}
                          placeholder="Select custom deadline"
                          className="w-full px-2.5 py-2 text-[13px] border border-[#D3D3D3] rounded-md"
                          value={rules.approvalCustom ?? ''}
                          onChange={e => setRules(r => ({ ...r, approvalCustom: e.target.value }))}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
          {/* Delete workspace */}
          <div className="mt-4">
            <div className="text-sm text-black font-medium mb-1">
              Delete workspace
            </div>
            <div className="text-sm text-grey font-normal mb-3">
              Deleting your workspace is permanent. You will immediately lose access to all your data.
            </div>
            <Button variant="outline" className="text-sm text-[#D82A2A] hover:text-[#D82A2A] px-3 py-1.5 font-medium border-strokeButton rounded-[5px] cursor-pointer" onClick={() => setOpenDelete(true)}>
              Delete workspace
            </Button>
          </div>

          {/* Bottom actions */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} className="text-sm font-medium px-3 py-1.5 rounded-[6px] cursor-pointer bg-main text-white hover:bg-main/90">
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>

      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent className="p-4">
          <AlertDialogCancel className="absolute top-2.5 right-2.5 h-7 w-7 p-0 rounded-full bg-transparent border-0 hover:bg-muted/50 cursor-pointer">
            <X className="h-4 w-4" />
          </AlertDialogCancel>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base text-black font-semibold">
              <Trash2 className="text-[#D82A2A] w-4.5 h-4.5" /> Delete your workspace
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3">
            <div className="text-sm text-darkGrey font-normal">
              This action cannot be undone. This will permanently delete your entire workspace <span className="text-black font-medium">Delete</span> and members in the workspace will lose access.
            </div>
            <div className="grid gap-3">
              <Label htmlFor="confirm-name" className="text-sm text-black font-medium">Enter workspace name to confirm</Label>
              <Input id="confirm-name" value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder="Workspace name" className="text-sm text-black font-normal" />
            </div>
          </div>
          <AlertDialogFooter className="flex w-full items-center">
            <AlertDialogAction
              className="bg-[#FAA7A7] text-white hover:bg-[#FAA7A7]/90 text-sm font-medium px-3 py-1.5 rounded-[6px] cursor-pointer"
              onClick={handleDelete}
              disabled={!ws || confirmName !== (ws?.name || "") || loading}
            >
              Permanently delete workspace
            </AlertDialogAction>
            <div className="ml-auto">
              <AlertDialogCancel disabled={loading} className="text-sm text-black font-medium px-3 py-1.5 rounded-[6px] cursor-pointer">Cancel</AlertDialogCancel>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper to generate 15-min time options as HH:mm
function generateTimeOptions() {
  const arr: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      arr.push(`${hh}:${mm}`);
    }
  }
  return arr;
}




