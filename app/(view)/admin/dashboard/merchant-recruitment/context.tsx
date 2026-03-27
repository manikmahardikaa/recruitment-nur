// context.tsx
"use client";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { SUMMARY_STAGE_CONFIG } from "@/app/utils/recruitment-stage";

export type StatusCard = { key: string; label: string; count: number };

type Ctx = {
  summary: StatusCard[];
  setSummary: (v: StatusCard[]) => void;
  sectionTitle: string;
  sectionSubtitle?: string;
  setSectionTitle: (t: string) => void;
  setSectionSubtitle: (s?: string) => void;
  onUpdateStatus?: (id: string, statusKey: string) => void;
  setOnUpdateStatus: (fn?: (id: string, statusKey: string) => void) => void; // NEW
};

const CtxRec = createContext<Ctx | null>(null);

export function RecruitmentProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<StatusCard[]>([
    { key: "all", label: "Total Applicants", count: 0 },
    ...SUMMARY_STAGE_CONFIG.map((item) => ({
      key: item.key,
      label: item.label,
      count: 0,
    })),
  ]);
  const [sectionTitle, setSectionTitle] = useState("Total Applicant");
  const [sectionSubtitle, setSectionSubtitle] = useState<string | undefined>(
    "Monitor the status and progress of all job applicants."
  );

  const [onUpdateStatus, setOnUpdateStatus] = useState<
    ((id: string, statusKey: string) => void) | undefined
  >();

  const value = useMemo(
    () => ({
      summary,
      setSummary,
      sectionTitle,
      sectionSubtitle,
      setSectionTitle,
      setSectionSubtitle,
      onUpdateStatus,
      setOnUpdateStatus, // expose setter
    }),
    [summary, sectionTitle, sectionSubtitle, onUpdateStatus]
  );

  return <CtxRec.Provider value={value}>{children}</CtxRec.Provider>;
}

export function useRecruitment() {
  const v = useContext(CtxRec);
  if (!v)
    throw new Error("useRecruitment must be used inside RecruitmentProvider");
  return v;
}
