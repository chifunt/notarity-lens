import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Euro,
  FileSearch,
  FileText,
  MapPinned,
  PackageCheck,
  Send,
  UploadCloud,
} from "lucide-react";

export const lensSteps = [
  { id: "start", path: "/", label: "Start", icon: UploadCloud },
  { id: "analyze", path: "/lens/analyze", label: "Analyze", icon: FileSearch },
  { id: "evidence", path: "/lens/evidence", label: "Evidence", icon: FileText },
  { id: "country", path: "/lens/country", label: "Country", icon: MapPinned },
  { id: "plan", path: "/lens/plan", label: "Route", icon: PackageCheck },
  { id: "cost", path: "/lens/cost", label: "Cost", icon: Euro },
  { id: "appointment", path: "/lens/appointment", label: "Appointment", icon: CalendarDays },
  { id: "review", path: "/lens/review", label: "Review", icon: ClipboardList },
  { id: "success", path: "/lens/success", label: "Success", icon: CheckCircle2 },
  { id: "submit", path: "/lens/review", label: "Submit", icon: Send },
] as const;

export type LensStepId = (typeof lensSteps)[number]["id"];
