import { CheckCircle2, Circle, ClipboardList, Columns3, FileOutput, FileText, PlayCircle, Settings, Sparkles, Stethoscope, TriangleAlert } from "lucide-react";

export type AppView = "Auto" | "Brief" | "Diagnose" | "Compare" | "Finish" | "Output" | "Settings";
export type AppViewStatus = "idle" | "done" | "error";

type AppSidebarProps = {
  activeView: AppView;
  executionMode: "Live" | "Demo";
  outputCount: number;
  statuses: Partial<Record<AppView, AppViewStatus>>;
  onChange: (view: AppView) => void;
};

const navigationItems = [
  { view: "Auto", label: "自動制作", description: "Finalまで", icon: PlayCircle },
  { view: "Brief", label: "要件入力", description: "入力を整理", icon: ClipboardList },
  { view: "Diagnose", label: "診断", description: "1案を見る", icon: Stethoscope },
  { view: "Compare", label: "比較", description: "複数案を整理", icon: Columns3 },
  { view: "Finish", label: "仕上げ", description: "背景とFinal", icon: Sparkles },
  { view: "Output", label: "Figma出力", description: "記録を確認", icon: FileOutput },
  { view: "Settings", label: "設定", description: "API接続", icon: Settings },
] satisfies Array<{ view: AppView; label: string; description: string; icon: typeof FileText }>;

export function AppSidebar({ activeView, executionMode, outputCount, statuses, onChange }: AppSidebarProps) {
  return (
    <aside className="app-sidebar" aria-label="メインナビゲーション">
      <div className="sidebar-brand">
        <strong>AI Cover Studio</strong>
        <span>Figma Plugin</span>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map(({ view, label, description, icon: Icon }) => {
          const status = statuses[view] ?? "idle";
          const active = view === activeView && view !== "Settings";
          return (
            <button key={view} className={active ? "sidebar-nav-item active" : "sidebar-nav-item"} type="button" onClick={() => onChange(view)}>
              <Icon size={15} aria-hidden="true" />
              <span>
                <strong>{label}</strong>
                <small>{description}</small>
              </span>
              <StatusGlyph status={status} active={active} />
            </button>
          );
        })}
      </nav>

      <div className="sidebar-status">
        <span className={executionMode === "Live" ? "sidebar-mode live" : "sidebar-mode demo"}>{executionMode}</span>
        <span>{outputCount}/7 Figma</span>
      </div>
    </aside>
  );
}

function StatusGlyph({ status, active }: { status: AppViewStatus; active: boolean }) {
  if (status === "error") return <TriangleAlert className="sidebar-status-icon error" size={13} aria-label="エラー" />;
  if (status === "done") return <CheckCircle2 className="sidebar-status-icon done" size={13} aria-label="完了" />;
  return <Circle className={active ? "sidebar-status-icon active" : "sidebar-status-icon"} size={9} aria-hidden="true" />;
}
