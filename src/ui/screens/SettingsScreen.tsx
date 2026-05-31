import { useState } from "react";
import { getRuntimeApiSettings, isRuntimeApiConfigured, isRuntimeLiveReady, notifyRuntimeApiSettingsChanged } from "../../config/runtimeApiSettings";
import type { RuntimeApiSettings } from "../../schemas/apiSettings";
import { postToPlugin } from "../../plugin/figma/messageBridge";
import { SectionHeader } from "../components/SectionHeader";
import { StatusLog } from "../components/StatusLog";

const difyFields: Array<[keyof RuntimeApiSettings["dify"], string, string]> = [
  ["inputOrganizer", "Input Organizer", "入力内容を制作ブリーフへ整理"],
  ["ideaExplorer", "Idea Explorer", "30案のコピー・訴求軸を探索"],
  ["typographyPlanner", "Typography Planner", "15案のLayout Draft JSONを作成"],
  ["candidateSelector", "Candidate Selector", "15案から5案を選定"],
  ["diagnosis", "Diagnosis", "選択案の診断コメントを生成"],
  ["compare", "Compare", "5案比較とbackground briefを生成"],
];

const uiSizePresets = {
  vertical: { label: "縦長", description: "左ナビと縦スクロール中心で確認する", width: 720, height: 620 },
  work: { label: "作業", description: "入力と結果を並べて広めに使う", width: 840, height: 680 },
  review: { label: "全体確認", description: "レビュー時に全体を見渡す", width: 1040, height: 720 },
} as const;

type UiSizePreset = keyof typeof uiSizePresets;

type SettingsScreenProps = {
  compact?: boolean;
};

export function SettingsScreen({ compact = false }: SettingsScreenProps) {
  const [settings] = useState<RuntimeApiSettings>(() => getRuntimeApiSettings());
  const [uiSize, setUiSize] = useState<UiSizePreset>("vertical");
  const [logs, setLogs] = useState<string[]>([
    "認証情報はこの画面では設定・保存しません。接続情報はsrc/config/apiSettings.tsで管理します。",
  ]);

  function handleResizeUi(size: UiSizePreset) {
    const preset = uiSizePresets[size];
    setUiSize(size);
    postToPlugin({ type: "RESIZE_UI", payload: { width: preset.width, height: preset.height } });
    setLogs((items) => [...items, `表示サイズを${preset.label}に変更しました。`]);
  }

  function handleRefreshStatus() {
    notifyRuntimeApiSettingsChanged(settings);
    setLogs((items) => [...items, "コード側API設定の状態を再確認しました。"]);
  }

  return (
    <div className={compact ? "settings-screen settings-screen-compact" : "settings-screen"}>
      <section className="panel settings-summary-panel">
        <SectionHeader
          title="設定"
          description="認証情報は非公開情報のため、この画面では入力・保存しません。src/config/apiSettings.tsで管理します。"
        />
        <div className="settings-mode-panel" aria-label="制作モード">
          <div>
            <strong>制作モード</strong>
            <span>{isRuntimeLiveReady(settings) ? "API接続" : "Demo確認"}</span>
          </div>
          <p>
            {isRuntimeApiConfigured(settings)
              ? "コード側のAPI設定を検出しました。APIモードでは失敗時にDemoへ自動で逃げません。"
              : "コード側API設定は未検出です。Demoは理想形の確認用として動作します。"}
          </p>
        </div>

        <div className="settings-summary">
          <span>現在: {isRuntimeLiveReady(settings) ? "APIモード" : "Demoモード"}</span>
          <span>Dify: {configuredDifyCount(settings)}/6 workflow</span>
          <span>Gemini: {settings.gemini.apiKey.trim() ? "設定済み" : "未設定"}</span>
        </div>
        <p className="settings-note">
          認証情報はUI、localStorage、Figma clientStorageへ保存しません。公開前はサーバーProxy化も検討してください。
        </p>
      </section>

      <section className="settings-grid">
        <div className="panel">
          <SectionHeader title="API接続ステータス" description="コード側設定の有無だけを表示します。Key値は表示しません。" />
          <div className="settings-form-grid">
            {difyFields.map(([workflow, label, description]) => {
              const configured = settings.dify[workflow].url.trim() && settings.dify[workflow].apiKey.trim();
              return (
                <div className="settings-fieldset" key={workflow}>
                  <strong>{label}</strong>
                  <p>{description}</p>
                  <span className={configured ? "settings-status-pill configured" : "settings-status-pill"}>{configured ? "設定済み" : "未設定"}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <SectionHeader title="Plugin表示" description="API設定とは分離した、作業画面の表示サイズだけを調整できます。" />
          <div className="settings-size-panel" aria-label="表示サイズ">
            <div className="size-preset-list" role="group" aria-label="表示サイズプリセット">
              {(Object.keys(uiSizePresets) as UiSizePreset[]).map((key) => {
                const preset = uiSizePresets[key];
                return (
                  <button key={key} className={uiSize === key ? "active" : ""} type="button" onClick={() => handleResizeUi(key)}>
                    <strong>{preset.label}</strong>
                    <small>{preset.description}</small>
                    <em>{preset.width}x{preset.height}</em>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="settings-actions">
            <button className="secondary-button" type="button" onClick={handleRefreshStatus}>
              接続状態を再確認
            </button>
          </div>
          <StatusLog entries={logs.slice(-5)} />
        </div>
      </section>
    </div>
  );
}

function configuredDifyCount(settings: RuntimeApiSettings): number {
  return Object.values(settings.dify).filter((workflow) => workflow.url.trim() && workflow.apiKey.trim()).length;
}
