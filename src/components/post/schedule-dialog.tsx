/* components/post/schedule-dialog.tsx
-------------------------------------------------------------- */
'use client'

import { useState } from 'react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
}                             from '@/components/ui/dialog'
import { Button }             from '@/components/ui/button'
import { RadioGroup,
        RadioGroupItem }     from '@/components/ui/radio-group'
import { ScrollArea }         from '@/components/ui/scroll-area'
import { Slot }               from '@/lib/scheduling/getSuggestedSlots'
import { format }             from 'date-fns'

export default function ScheduleDialog ({
    slots,
    open,
    onConfirm,
    onClose,
}:{
    slots    : Slot[]
    open     : boolean
    onConfirm: (d: Date)=>void
    onClose  : ()=>void
}) {
    if (!open) return null
    const [val,setVal] = useState(slots[0]?.date.toISOString() ?? '')

    return (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[420px]">
        <DialogHeader>
            <DialogTitle>Select publishing slot</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-64 pr-2">
            <RadioGroup value={val} onValueChange={setVal} className="space-y-4">
            {slots.map((s,i) => (
                <label
                key={s.date.toISOString()}
                className="flex items-start gap-3 rounded-md border p-2 cursor-pointer
                            hover:bg-muted"
                >
                <RadioGroupItem value={s.date.toISOString()} />
                <div className="flex-1 text-sm">
                    <p className="font-medium">
                    {format(s.date,'eee PPP p')}
                    {i === 0 && (
                        <span className="ml-1 rounded-sm bg-emerald-600/15
                                        px-1 text-[10px] text-emerald-700">
                        suggested
                        </span>
                    )}
                    </p>
                    <p className="text-xs text-muted-foreground">{s.reason}</p>
                </div>
                </label>
            ))}
            </RadioGroup>
        </ScrollArea>

        <DialogFooter>
            <Button disabled={!val}
                    onClick={()=>onConfirm(new Date(val))}
                    className="bg-emerald-600 text-white hover:bg-emerald-700">
            Schedule
            </Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>
    )
}
