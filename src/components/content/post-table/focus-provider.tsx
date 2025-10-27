// FocusProvider.tsx
"use client";
import * as React from "react";

type FocusedCell = {
  rowId: string;
  colId: string;
  inEdit?: boolean;
} | null;

interface CellFocusContextValue {
  focused: FocusedCell;
  setFocused: React.Dispatch<React.SetStateAction<FocusedCell>>;
}

const CellFocusContext = React.createContext<CellFocusContextValue>({
  focused: null,
  setFocused: ()=>{},
});

export function CellFocusProvider({ children }: { children: React.ReactNode }) {
  const [focused, setFocused] = React.useState<FocusedCell>(null);

  React.useEffect(()=>{
    function handleGlobalClick(e: MouseEvent){
      const el = e.target as HTMLElement;
      if(!el.closest("[data-focus-cell='true']")){
        // clicked outside any cell => remove focus
        setFocused(null);
      }
    }
    window.addEventListener("mousedown", handleGlobalClick);
    return () => window.removeEventListener("mousedown", handleGlobalClick);
  },[]);

  return (
    <CellFocusContext.Provider value={{focused, setFocused}}>
      {children}
    </CellFocusContext.Provider>
  );
}

/** 
 * <FocusCell> 
 *   1) first click => setsFocus => show ring
 *   2) second click => if already focused => sets inEdit=>true
 *   
 *   If singleClickEdit is true:
 *   1) first click => setsFocus AND sets inEdit=true => show ring + open popup
 */
export function FocusCell({
  rowId,
  colId,
  children,
  className,
  style,
  singleClickEdit = false,
}: {
  rowId: string;
  colId: string;
  children: (args: {
    isFocused: boolean;
    isEditing: boolean;
    exitEdit: () => void;
    enterEdit: () => void;
  }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  singleClickEdit?: boolean;
}) {
  const { focused, setFocused } = React.useContext(CellFocusContext);
  
  const isFocused = (focused?.rowId === rowId && focused?.colId === colId);
  const isEditing = isFocused && focused?.inEdit === true;

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if(!isFocused) {
      // first click => focus
      if (singleClickEdit) {
        // For cells that should open popup on first click, set both focus and edit
        setFocused({ rowId, colId, inEdit: true });
      } else {
        setFocused({ rowId, colId, inEdit: false });
      }
    } else {
      // second click => set inEdit = true (only for non-singleClickEdit cells)
      if(!isEditing && !singleClickEdit) {
        setFocused({ rowId, colId, inEdit: true });
      }
    }
  }

  function exitEdit() {
    if(isFocused && isEditing) {
      // remain focused, but no longer editing
      setFocused({ rowId, colId, inEdit: false });
    }
  }
  function enterEdit() {
    if(isFocused && !isEditing) {
      setFocused({ rowId, colId, inEdit: true });
    }
  }

  const ringShadow = '0 0 0 2px #125AFF';
  const combinedStyle: React.CSSProperties = { ...style };

  if (isFocused) {
    const existingShadow = style?.boxShadow || '';
    combinedStyle.boxShadow = existingShadow ? `${ringShadow}, ${existingShadow}` : ringShadow;
    combinedStyle.zIndex = (parseInt(String(style?.zIndex || 0), 10)) + 1;
  }

  return (
    <td
      data-focus-cell="true"
      className={`
        relative
        ${className ?? ""}
        ${isFocused ? "bg-[#EDF6FF]" : ""}
      `}
      style={combinedStyle}
      onClick={handleClick}
    >
      {children({
        isFocused: !!isFocused,
        isEditing: !!isEditing,
        exitEdit,
        enterEdit,
      })}
    </td>
  );
}
