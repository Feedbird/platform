'use client'
import { useEffect, useState }       from 'react'
import { Dialog, DialogContent,
         DialogHeader, DialogTitle,
         DialogFooter }              from '@/components/ui/dialog'
import { Input }                     from '@/components/ui/input'
import { Button }                    from '@/components/ui/button'

interface Initial {
  id   ?: string;
  name : string;
  colors?: string[];
  font ?: string;
}

interface Props {
  open   : boolean;
  onClose(): void;
  initial?: Initial;
  onSave (data:{name:string,colors:string[],font:string}, id?:string): void;
}

export default function BrandModal({ open, onClose, initial, onSave }: Props) {
  const [name,   setName]   = useState(initial?.name   ?? '');
  const [colors, setColors] = useState<string[]>(initial?.colors ?? ['#1e293b','#0284c7','#e11d48']);
  const [font,   setFont]   = useState(initial?.font   ?? 'Inter');

  /* reset when editing another brand ------------------------------- */
  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setColors(initial?.colors ?? ['#1e293b','#0284c7','#e11d48']);
    setFont(initial?.font ?? 'Inter');
  }, [open, initial]);

  const addSwatch = () => setColors(c => [...c, '#ffffff']);
  const updateSwatch = (i:number,val:string) =>
    setColors(c => c.map((col,idx) => idx===i ? val : col));
  const removeSwatch = (i:number) =>
    setColors(c => c.filter((_,idx)=>idx!==i));

  const submit = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), colors, font }, initial?.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm space-y-4">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit brand' : 'Add brand'}</DialogTitle>
        </DialogHeader>

        {/* name ------------------------------------------------------ */}
        <Input placeholder="Brand name"
               value={name}
               onChange={e => setName(e.target.value)} />

        {/* colours --------------------------------------------------- */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Colours
          </span>
          <div className="flex flex-wrap gap-2">
            {colors.map((c,idx)=>(
              <div key={idx} className="relative">
                <input type="color"
                       value={c}
                       onChange={e => updateSwatch(idx,e.target.value)}
                       className="h-8 w-8 rounded overflow-hidden border cursor-pointer"/>
                {colors.length>1 && (
                  <button type="button"
                          onClick={()=>removeSwatch(idx)}
                          className="absolute -top-2 -right-2 text-[10px] text-white bg-red-500 rounded-full px-[3px]">
                    ×
                  </button>
                )}
              </div>
            ))}
            <Button type="button" variant="ghost" size="icon"
                    onClick={addSwatch}>+</Button>
          </div>
        </div>

        {/* font ------------------------------------------------------ */}
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground">Font</span>
          <Input value={font}
                 onChange={e=>setFont(e.target.value)}
                 placeholder="CSS font‑family string"/>
        </div>

        <DialogFooter>
          <Button onClick={submit}>
            {initial ? 'Save changes' : 'Create brand'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
