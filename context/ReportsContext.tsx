import React, { createContext, useCallback, useContext, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ReportCategory =
  | "Comportamiento inapropiado"
  | "Spam o publicidad"
  | "Contenido ofensivo"
  | "Acoso o bullying"
  | "Otro";

export type ReportStatus = "pendiente" | "resuelto";

export interface UserReport {
  id: string;
  reportedUserName: string;
  parcheName: string;
  category: ReportCategory;
  description: string;
  date: string;
  status: ReportStatus;
}

// ── Mock data (matching web frontend) ─────────────────────────────────────────

const MOCK_REPORTS: UserReport[] = [
  {
    id: "r1",
    reportedUserName: "Carlos Pérez",
    parcheName: "Calculo III",
    category: "Spam o publicidad",
    description: "Envía enlaces de publicidad constantemente al canal general.",
    date: "2026-07-10",
    status: "pendiente",
  },
  {
    id: "r2",
    reportedUserName: "María López",
    parcheName: "Gaming Club",
    category: "Contenido ofensivo",
    description: "Publicó imágenes ofensivas en el chat del parche.",
    date: "2026-07-09",
    status: "pendiente",
  },
  {
    id: "r3",
    reportedUserName: "Andrés Gómez",
    parcheName: "Deportes",
    category: "Acoso o bullying",
    description: "Hostiga a otros miembros con mensajes repeatedly.",
    date: "2026-07-08",
    status: "resuelto",
  },
  {
    id: "r4",
    reportedUserName: "Laura Martínez",
    parcheName: "Música",
    category: "Otro",
    description: "Compartió información personal de otros miembros sin consentimiento.",
    date: "2026-07-07",
    status: "resuelto",
  },
];

// ── Context ───────────────────────────────────────────────────────────────────

interface ReportsContextValue {
  reports: UserReport[];
  addReport: (report: Omit<UserReport, "id" | "date" | "status">) => void;
  resolveReport: (id: string) => void;
  pendingCount: number;
}

const ReportsContext = createContext<ReportsContextValue>({
  reports: [],
  addReport: () => {},
  resolveReport: () => {},
  pendingCount: 0,
});

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<UserReport[]>(MOCK_REPORTS);

  const addReport = useCallback(
    (report: Omit<UserReport, "id" | "date" | "status">) => {
      const newReport: UserReport = {
        ...report,
        id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString().split("T")[0],
        status: "pendiente",
      };
      setReports((prev) => [newReport, ...prev]);
    },
    []
  );

  const resolveReport = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "resuelto" as const } : r))
    );
  }, []);

  const pendingCount = reports.filter((r) => r.status === "pendiente").length;

  return (
    <ReportsContext.Provider value={{ reports, addReport, resolveReport, pendingCount }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  return useContext(ReportsContext);
}
