"use client";

import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { TimezonePicker } from "@/components/ui/timezone-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";

const WEEKDAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] as const;

interface DaySlot { start?: string; end?: string; }

interface Props {
  initialTimezone?: string;
  initialSlots?: Partial<Record<typeof WEEKDAYS[number], DaySlot>>;
  onSave: (tz:string, slots:Partial<Record<typeof WEEKDAYS[number], DaySlot>>) => void;
  onBack: () => void;
}

export const PostingSettingsPanel: React.FC<Props> = ({ initialTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone, initialSlots = {}, onSave, onBack }) => {
  const [timezone, setTimezone] = React.useState(initialTimezone);
  const [slots, setSlots] = React.useState<Partial<Record<typeof WEEKDAYS[number], DaySlot>>>(initialSlots);

  const timeOptions = React.useMemo(()=>{
    const arr:string[]=[]; for(let h=0;h<24;h++){ for(const m of [0,15,30,45]) arr.push(format(new Date(2020,0,1,h,m),"HH:mm")); }
    return arr;
  },[]);
  // tzOptions removed – using TimezonePicker instead

  function updateDay(day:string, update:DaySlot){ setSlots(prev=>({ ...prev, [day]: update })); }

  return (
    <div style={{display:"flex",width:340,padding:16,flexDirection:"column",alignItems:"flex-start",alignSelf:"stretch",borderRadius:8,border:"1px solid #E6E4E2",background:"#FFF",boxShadow:"0px 20px 24px -4px rgba(16,24,40,0.08),0px 8px 8px -4px rgba(16,24,40,0.03)"}}>
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium mb-2">
        <img src="/images/publish/timezone.svg" width={14} height={14} alt="tz"/> Change workspace timezone
      </div>

      {/* Timezone select */}
      <div className="w-full border border-buttonStroke rounded-[6px] text-sm text-black font-normal">
        <TimezonePicker value={timezone} onChange={setTimezone} className="w-full" />
      </div>

      {/* Allowed posting */}
      <div className="flex items-center gap-2 text-sm font-medium mt-5">
        <img src="/images/columns/updated-time.svg" width={14} height={14} alt="allowed"/> Allowed Posting Time
      </div>
      <div className="flex flex-col gap-2 pr-1 w-full mt-2">
        {WEEKDAYS.map(day=>{
          const slot=slots[day]||{}; const has=!!slot.start&&!!slot.end;
          return (
            <div key={day} className="flex items-center gap-3 min-h-10 w-full">
              <div className={cn("flex justify-center items-center text-white text-xs font-semibold w-6 h-6 rounded-full", has?"bg-[#125AFF]":"bg-[#838488]")}>{day[0]}</div>
              {has ? (
                <div className="flex-1 flex items-center gap-1">
                  <Select value={slot.start} onValueChange={v=>updateDay(day,{...slot,start:v})}>
                    <SelectTrigger className="h-8 text-xs w-24 border rounded px-1"><SelectValue placeholder="Start"/></SelectTrigger>
                    <SelectContent className="max-h-40 overflow-y-auto">{timeOptions.map(t=>(<SelectItem key={t} value={t} className="text-xs h-7">{t}</SelectItem>))}</SelectContent>
                  </Select>
                  <span className="text-xs">-</span>
                  <Select value={slot.end} onValueChange={v=>updateDay(day,{...slot,end:v})}>
                    <SelectTrigger className="h-8 text-xs w-24 border rounded px-1"><SelectValue placeholder="End"/></SelectTrigger>
                    <SelectContent className="max-h-40 overflow-y-auto">{timeOptions.map(t=>(<SelectItem key={t} value={t} className="text-xs h-7">{t}</SelectItem>))}</SelectContent>
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
                  cursor: "pointer"
                }}
                onClick={() => { 
                  has ? updateDay(day, {}) : updateDay(day, { start: "09:00", end: "17:00" }); 
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

      {/* footer */}
      <div className="flex gap-2 pt-2 w-full">
        <button
          onClick={onBack}
          style={{display:"flex",height:36,padding:"8px 16px",justifyContent:"center",alignItems:"center",gap:8,borderRadius:6,border:"1px solid #D3D3D3"}}
          className="text-sm flex-none"
        >Back</button>
        <button
          onClick={()=>onSave(timezone,slots)}
          style={{display:"flex",padding:"8px 16px",justifyContent:"center",alignItems:"center",gap:8,flex:"1 0 0",borderRadius:6,border:"1px solid rgba(28,29,31,0.10)",background:"#125AFF",color:"#FFF",boxShadow:"0px 1px 2px 0px rgba(16,24,40,0.05)"}}
          className="text-sm"
        >Save changes</button>
      </div>
    </div>
  );
}; 