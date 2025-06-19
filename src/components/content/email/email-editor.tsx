'use client'
import { useState } from 'react'
import { Button }   from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import dynamic from 'next/dynamic'

/*  TinyMCE is zero‑config, runs client only                      */
const Editor = dynamic(()=>import('@tinymce/tinymce-react')
                        .then(m=>m.Editor),{ssr:false})

export default function EmailEditor({
  value, onSave,
}: {value:string; onSave(html:string):void}) {

  const [html,setHtml] = useState(value)

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 border rounded-t">
        <Editor
          value={html}
          init={{
            menubar:false, height:400,
            plugins:'link lists image',
            toolbar:'bold italic underline | bullist numlist | link | removeformat',
          }}
          onEditorChange={c=>setHtml(c)}
        />
      </ScrollArea>

      <div className="p-2 border rounded-b flex justify-end">
        <Button onClick={()=>onSave(html)}>Save changes</Button>
      </div>
    </div>
  )
}
