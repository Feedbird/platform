import {
    ChevronUpIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronFirstIcon,
    ChevronLastIcon,
    EditIcon,
    FilterIcon,
    GripVertical,
    PlusIcon,
    CalendarIcon,
    MessageSquare,
    ListPlus,
    Film,
    ImageIcon,
    FolderOpen,
    CheckIcon,
    AlertTriangle,
    MessageCircleMore,
    CircleCheck,
    SlidersHorizontal
} from "lucide-react";

type ColumnMeta = {
  label: string;
  icon: React.ReactNode;
};

// Shared Column Metadata for consistency
export const columnMeta: Record<ColumnID, ColumnMeta> = {
  status: {
    label: "Status",
    icon: <FolderOpen className="mr-1 h-3 w-3" />,
  },
  preview: {
    label: "Preview",
    icon: <ImageIcon className="mr-1 h-3 w-3" />,
  },
  caption: {
    label: "Caption",
    icon: <EditIcon className="mr-1 h-3 w-3" />,
  },
  platforms: {
    label: "Socials",
    icon: <ListPlus className="mr-1 h-3 w-3" />,
  },
  format: {
    label: "Format",
    icon: <Film className="mr-1 h-3 w-3" />,
  },
  publish_date: {
    label: "Post Time",
    icon: <CalendarIcon className="mr-1 h-3 w-3" />,
  },
  month: {
    label: "Month",
    icon: <CalendarIcon className="mr-1 h-3 w-3" />,
  },
  revision: {
    label: "Revision",
    icon: <AlertTriangle className="mr-1 h-3 w-3" />,
  },
  settings: {
    label: "Settings",
    icon: <SlidersHorizontal className="mr-1 h-3 w-3" />,
  },
  approve: {
    label: "Approve",
    icon: <CheckIcon className="mr-1 h-3 w-3" />,
  },
  updatedAt: {
    label: "Updated At",
    icon: <CalendarIcon className="mr-1 h-3 w-3" />,
  },
};
  
export type ColumnID = 
| 'status'
| 'preview'
| 'caption'
| 'platforms'
| 'format'
| 'settings'
| 'publish_date'
| 'revision'
| 'approve'
| 'month'
| 'updatedAt';