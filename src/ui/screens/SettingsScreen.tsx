import { useEffect, useState } from "react";
import { emptyRuntimeApiSettings, type RuntimeApiSettings } from "../../schemas/apiSettings";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { isRuntimeLiveReady, maskSecret, saveRuntimeApiSettings } from "../../config/runtimeApiSettings";
import { ErrorMessage } from "../components/ErrorMessage";
import { SectionHeader } from "../components/SectionHeader";
import { StatusLog } from "../components/StatusLog";
import { SuccessMessage } from "../components/SuccessMessage";

const difyFields: Array<[keyof RuntimeApiSettings["dify"], string, string]> = [
  ["inputOrganizer", "Input Organizer", "入力内容をNormalizedCreativeInputへ整理"],
  ["ideaExplorer", "Idea Explorer", "30案のコピー・訴求軸を探索"],
  ["typographyPlanner", "Typography Planner", "15案のLayout Draft JSONを作成"],
  ["candidateSelector", "Candidate Selector", "15案から5案を選定"],
  ["diagnosis", "Diagnosis", "選択案の診断コメントを生成"],
  ["compare", "Compare", "5案比較とbackground briefを生成"],
];

export function SettingsScreen() {
  const [settings, setSettings] = useState<RuntimeApiSettings>(emptyRuntimeApiSettings);
  const [logs, setLogs] = useState<string[]>([
    "API設定を保存するとLive Modeで制作フローを実行できます。未設定の場合はDemo Modeで動作します。",
  ]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ pluginMessage?: PluginResponseMessage }>) => {
      const message = event.data.pluginMessage;
      if (!message) return;
      if (message.type === "API_SETTINGS_LOADED" && message.payload.settings) {
        setSettings(message.payload.settings);
        saveRuntimeApiSettings(message.payload.settings);
        setLogs((items) => [...items, "保存済みのAPI設定を読み込みました。"]);
      }
      if (message.type === "API_SETTINGS_SAVED") {
        setSuccess("API設定を保存しました。");
        setLogs((items) => [...items, "Figma clientStorageにAPI設定を保存しました。"]);
      }
      if (message.type === "API_SETTINGS_TEST_RESULT") {
        setLogs((items) => [...items, message.payload.message]);
        if (message.payload.ok) setSuccess(message.payload.message);
        else setError(message.payload.message);
      }
      if (message.type === "PLUGIN_ERROR") setError(message.payload.message);
    };
    window.addEventListener("message", handleMessage);
    postToPlugin({ type: "LOAD_API_SETTINGS" });
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const handleHeaderSave = () => handleSave();
    window.addEventListener("SAVE_API_SETTINGS_FROM_HEADER", handleHeaderSave);
    return () => window.removeEventListener("SAVE_API_SETTINGS_FROM_HEADER", handleHeaderSave);
  });

  function updateDify(workflow: keyof RuntimeApiSettings["dify"], key: "url" | "apiKey", value: string) {
    setSettings((current) => ({
      ...current,
      dify: { ...current.dify, [workflow]: { ...current.dify[workflow], [key]: value } },
    }));
  }

  function updateGemini(key: keyof RuntimeApiSettings["gemini"], value: string) {
    setSettings((current) => ({ ...current, gemini: { ...current.gemini, [key]: value } }));
  }

  function handleSave() {
    setError(null);
    setSuccess(null);
    saveRuntimeApiSettings(settings);
    postToPlugin({ type: "SAVE_API_SETTINGS", payload: settings });
  }

  function handleTest() {
    setError(null);
    setSuccess(null);
    postToPlugin({ type: "TEST_API_SETTINGS", payload: settings });
  }

  return (
    <div className="settings-screen">
      <section className="panel settings-summary-panel">
        <SectionHeader
          title="API設定"
          description="Dify / Geminiの接続情報を保存します。API Keyは画面上でマスク表示し、ログには出しません。"
        />
        {success && <SuccessMessage title={success} />}
        {error && <ErrorMessage title="設定を確認してください" detail={error} />}
        <div className="settings-summary">
          <span>実行モード: {isRuntimeLiveReady(settings) ? "Live" : "Demo"}</span>
          <span>Dify: {configuredDifyCount(settings)}/6 workflow</span>
          <span>Gemini: {maskSecret(settings.gemini.apiKey)}</span>
        </div>
        <p className="settings-note">
          優先順位は Figma clientStorage、src/config/apiSettings.ts、apiSettings.example.ts の順です。Gitに実キーを入れないでください。
        </p>
      </section>

      <section className="settings-grid">
        <div className="panel">
          <SectionHeader title="Dify Workflow" description="WorkflowごとのURLとAPI Keyを入力します。" />
          <div className="settings-form-grid">
            {difyFields.map(([workflow, label, description]) => (
              <fieldset className="settings-fieldset" key={workflow}>
                <legend>{label}</legend>
                <p>{description}</p>
                <label>
                  Workflow URL
                  <input
                    value={settings.dify[workflow].url}
                    onChange={(event) => updateDify(workflow, "url", event.target.value)}
                    placeholder="https://api.dify.ai/v1/workflows/run"
                  />
                </label>
                <label>
                  API Key
                  <input
                    type="password"
                    value={settings.dify[workflow].apiKey}
                    onChange={(event) => updateDify(workflow, "apiKey", event.target.value)}
                    placeholder="app-..."
                  />
                </label>
              </fieldset>
            ))}
          </div>
        </div>

        <div className="panel">
          <SectionHeader title="Gemini" description="5案の高品質SVG化と背景3案生成に使う設定です。" />
          <div className="settings-form-grid single">
            <label>
              API Key
              <input type="password" value={settings.gemini.apiKey} onChange={(event) => updateGemini("apiKey", event.target.value)} placeholder="AIza..." />
            </label>
            <label>
              Text Model
              <input value={settings.gemini.textModel} onChange={(event) => updateGemini("textModel", event.target.value)} />
            </label>
            <label>
              SVG Model
              <input value={settings.gemini.svgModel} onChange={(event) => updateGemini("svgModel", event.target.value)} />
            </label>
            <label>
              Image Model
              <input value={settings.gemini.imageModel} onChange={(event) => updateGemini("imageModel", event.target.value)} />
            </label>
          </div>
          <div className="settings-actions">
            <button className="secondary-button" type="button" onClick={handleTest}>
              接続設定を確認
            </button>
            <button className="primary-button" type="button" onClick={handleSave}>
              設定を保存
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
