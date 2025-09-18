import { cn } from "@/lib/utils";

// Responsive table column visibility classes
export const tableColumnClasses = {
  // Always visible columns (high priority)
  essential: "",

  // Hide on small screens (medium priority)
  hideSm: "hidden sm:table-cell",

  // Hide on small and medium screens (low priority)
  hideMd: "hidden md:table-cell",

  // Hide on small, medium, and large screens (lowest priority)
  hideLg: "hidden lg:table-cell",

  // Hide on extra small screens only
  hideXs: "hidden xs:table-cell",
};

// Text wrapping and max-width classes for different content types
export const tableCellClasses = {
  // For short text like names, IDs
  compact: "max-w-[150px] truncate",

  // For medium text like emails, titles
  medium: "max-w-[200px] break-words",

  // For long text like descriptions, notes
  long: "max-w-[300px] break-words",

  // For very long text that should wrap
  wrap: "max-w-xs break-words whitespace-normal",

  // For action buttons/dropdowns
  actions: "w-[70px]",
};

// Helper function to combine column classes
export function getColumnClass(priority: keyof typeof tableColumnClasses, cellType?: keyof typeof tableCellClasses) {
  const columnClass = tableColumnClasses[priority];
  const cellClass = cellType ? tableCellClasses[cellType] : "";
  return cn(columnClass, cellClass);
}

// Column priority definitions for each page
export const columnPriorities = {
  contacts: {
    name: "essential",
    email: "hideSm",
    phone: "hideMd",
    title: "hideLg",
    lastContact: "hideSm",
    nextContact: "hideMd",
    assignedTo: "hideLg",
    actions: "essential",
  },
  companies: {
    name: "essential",
    website: "hideSm",
    industry: "hideMd",
    size: "hideLg",
    location: "hideLg",
    contacts: "hideSm",
    assignedTo: "hideMd",
    actions: "essential",
  },
  opportunities: {
    name: "essential",
    stage: "essential",
    value: "hideSm",
    company: "hideSm",
    contact: "hideMd",
    closeDate: "hideMd",
    assignedTo: "hideLg",
    actions: "essential",
  },
  activities: {
    type: "hideMd",
    subject: "essential",
    contact: "hideSm",
    deal: "hideMd",
    date: "essential",
    assignedTo: "hideLg",
    description: "hideMd",
    actions: "essential",
  },
  team: {
    name: "essential",
    email: "hideSm",
    role: "essential",
    joinedAt: "hideMd",
    status: "hideSm",
    actions: "essential",
  },
};