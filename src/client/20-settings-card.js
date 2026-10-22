    // ---- 设置卡片：plugins.bundle.config（key = bundle 包名），对齐官方配置卡片样式 ----
    // 开关走 configForms；提示词正文唯一来源是 profile 目录的 .visualizer-widget/prompt.md。
    // 本卡片经同源 route /dsh-visualizer-widget/api 读写该文件，也允许用户直接编辑文件。
    const NS = "visualizer-widget";
    // plugins.bundle.config 的 key 是 bundle 的 npm 包名（宿主按 pkg.name 分发）。
    const BUNDLE_KEY = "dsh-visualizer-widget";
    const API_BASE = "/dsh-visualizer-widget/api";

    const SETTINGS_CSS = [
      // 卡片外壳（官方 .card）
      ".dsh-viz-card{list-style:none;border:.5px solid var(--dsw-alias-border-l4);border-radius:16px;background:var(--dsw-alias-bg-layer-3);transition:border-color .16s,background .16s}",
      ".dsh-viz-card:hover{border-color:var(--dsw-alias-label-dimmed)}",
      ".dsh-viz-card-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}",
      // 可折叠 header
      ".dsh-viz-card-header{width:100%;appearance:none;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px}",
      ".dsh-viz-card-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
      ".dsh-viz-card-head-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}",
      ".dsh-viz-card-name{font-size:15px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary)}",
      ".dsh-viz-card-desc{font-size:13px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}",
      ".dsh-viz-card-pending{flex:none;border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px;font-weight:500;white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}",
      ".dsh-viz-card-chevron{flex:none;width:7px;height:7px;border-right:1.5px solid var(--dsw-alias-label-tertiary);border-bottom:1.5px solid var(--dsw-alias-label-tertiary);transform:rotate(45deg);transition:transform .16s;margin-top:-4px}",
      ".dsh-viz-card-chevron-open{transform:rotate(225deg);margin-top:4px}",
      // body（展开区）
      ".dsh-viz-card-body{border-top:.5px solid var(--dsw-alias-border-l2);margin:0 16px;padding:14px 0 10px}",
      // switch 行（官方 .toggleRow）
      ".dsh-viz-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary);padding-bottom:12px}",
      ".dsh-viz-toggle-label{flex:1;min-width:0}",
      ".dsh-viz-switch{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;padding:2px;border:0;border-radius:10px;background:var(--dsw-alias-border-l3);cursor:pointer}",
      ".dsh-viz-switch-on{background:var(--dsw-alias-brand-primary)}",
      ".dsh-viz-switch:disabled{cursor:default;opacity:.5}",
      ".dsh-viz-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}",
      ".dsh-viz-thumb{display:block;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground);transition:transform 120ms ease}",
      ".dsh-viz-switch-on .dsh-viz-thumb{transform:translateX(16px)}",
      // 提示词文件路径
      ".dsh-viz-path{margin:2px 0 8px;font:12px/1.7 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--dsw-alias-label-tertiary);word-break:break-all}",
      // 提示词文本框
      ".dsh-viz-setting-input{width:100%;box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);resize:vertical}",
      ".dsh-viz-setting-input:disabled{opacity:.6}",
      // footer（官方 .footer + .discard + .save）
      ".dsh-viz-card-footer{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 0 4px;border-top:.5px solid var(--dsw-alias-border-l2)}",
      ".dsh-viz-card-failed{flex:1;min-width:0;margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}",
      ".dsh-viz-card-discard,.dsh-viz-card-save{appearance:none;border:1px solid transparent;border-radius:8px;padding:5px 14px;font:inherit;font-size:13px;line-height:1.5;cursor:pointer}",
      ".dsh-viz-card-discard{border-color:var(--dsw-alias-border-l2);background:none;color:var(--dsw-alias-label-secondary)}",
      ".dsh-viz-card-discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}",
      ".dsh-viz-card-save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}",
      ".dsh-viz-card-discard:disabled,.dsh-viz-card-save:disabled{opacity:.4;cursor:default}",
      ".dsh-viz-card-discard:focus-visible,.dsh-viz-card-save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}"
    ].join("\n");

    // 同源 route 调用；与宿主 prompt-api.mjs 的 { ok, value | error } 结构对齐。
    function apiCall(method, body) {
      return fetch(API_BASE + "/" + method, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body || {})
      }).then((response) => response.json().catch(() => ({})).then((data) => {
        if (!response.ok || !data || data.ok !== true) {
          const message = data && data.error && data.error.message ? data.error.message : "HTTP " + response.status;
          throw new Error(message);
        }
        return data.value;
      }));
    }

    function SettingsCard(props) {
      // plugins.bundle.config 的 owner 只传 {view:'page'}，form 由注册 descriptor 的 inject 提供。
      const form = props.form;
      const snapState = React.useState(form.getSnapshot());
      const snap = snapState[0];
      const setSnap = snapState[1];

      React.useEffect(() => form.subscribe(() => setSnap(form.getSnapshot())), []);

      const value = snap.value || {};
      const currentEnabled = value.enabled !== false;

      // 草稿：用户编辑后只进草稿，保存才写盘（staged + save + discard，与官方卡片一致）。
      const enabledState = React.useState(currentEnabled);
      const enabled = enabledState[0];
      const setEnabled = enabledState[1];

      const promptPhaseState = React.useState("loading");
      const promptPhase = promptPhaseState[0];
      const setPromptPhase = promptPhaseState[1];
      const remotePromptState = React.useState("");
      const currentPrompt = remotePromptState[0];
      const setCurrentPrompt = remotePromptState[1];
      const promptState = React.useState("");
      const prompt = promptState[0];
      const setPrompt = promptState[1];
      const fileState = React.useState("");
      const filePath = fileState[0];
      const setFilePath = fileState[1];
      const reloadState = React.useState(0);
      const reloadTick = reloadState[0];
      const setReloadTick = reloadState[1];

      const savingState = React.useState(false);
      const saving = savingState[0];
      const setSaving = savingState[1];
      const flagState = React.useState("");
      const flag = flagState[0];
      const setFlag = flagState[1];
      const openState = React.useState(false);
      const open = openState[0];
      const setOpen = openState[1];

      // 读取 prompt.md（经宿主 route；读不到时禁用文本框，但开关仍可保存）。
      React.useEffect(() => {
        let alive = true;
        setPromptPhase("loading");
        setFlag("");
        apiCall("prompt.get")
          .then((result) => {
            if (!alive) return;
            setCurrentPrompt(result.prompt);
            setPrompt(result.prompt);
            setFilePath(result.file || "");
            setPromptPhase("ready");
          })
          .catch((error) => {
            if (!alive) return;
            setPromptPhase("error");
            setFlag("读取提示词失败：" + (error && error.message ? error.message : String(error)));
          });
        return () => { alive = false; };
      }, [reloadTick]);

      const writable = snap.status === "ready" && snap.writable !== false;
      const promptReady = promptPhase === "ready";
      const dirtyPrompt = promptReady && prompt.trim() !== currentPrompt;
      const dirty = enabled !== currentEnabled || dirtyPrompt;
      const promptInvalid = promptReady && prompt.trim().length === 0;

      const discard = () => {
        setEnabled(currentEnabled);
        if (promptReady) setPrompt(currentPrompt);
        setFlag("");
      };

      const save = () => {
        if (!writable || !dirty || saving || promptInvalid) return;
        if (dirtyPrompt && !promptReady) return;
        setSaving(true);
        setFlag("");
        const text = prompt.trim();
        const promptStep = dirtyPrompt ? apiCall("prompt.update", { prompt: text }) : Promise.resolve(null);
        promptStep
          .then((result) => {
            if (result) {
              setCurrentPrompt(result.prompt);
              setPrompt(result.prompt);
              setFilePath(result.file || filePath);
            }
            if (enabled !== currentEnabled) {
              return form.mutate([
                { op: "set", path: ["enabled"], value: enabled }
              ], snap.revision).then((ok) => {
                if (!ok) throw new Error("开关保存被拒绝（值未通过校验）");
              });
            }
            return null;
          })
          .then(() => setFlag("已保存"))
          .catch((err) => setFlag("保存失败：" + (err && err.message ? err.message : String(err))))
          .finally(() => setSaving(false));
      };

      const header = React.createElement("button", {
        type: "button",
        className: "dsh-viz-card-header",
        "aria-expanded": open,
        onClick: () => setOpen(!open)
      },
        React.createElement("span", { className: "dsh-viz-card-head-text" },
          React.createElement("span", { className: "dsh-viz-card-name" }, "可视化渲染指令"),
          React.createElement("span", { className: "dsh-viz-card-desc" },
            "把 .visualizer-widget/prompt.md 的指令注入系统提示词；可在下方直接修改，或编辑该文件，下一轮生效。")),
        dirty ? React.createElement("span", { className: "dsh-viz-card-pending" }, "未保存") : null,
        React.createElement("span", {
          className: "dsh-viz-card-chevron" + (open ? " dsh-viz-card-chevron-open" : "")
        })
      );

      const body = open
        ? React.createElement("div", { className: "dsh-viz-card-body" },
            React.createElement("div", { className: "dsh-viz-toggle-row" },
              React.createElement("span", { className: "dsh-viz-toggle-label" }, "启用提示词注入"),
              React.createElement("button", {
                type: "button",
                role: "switch",
                "aria-checked": enabled,
                className: "dsh-viz-switch" + (enabled ? " dsh-viz-switch-on" : ""),
                disabled: !writable || saving,
                onClick: () => setEnabled(!enabled)
              }, React.createElement("span", { className: "dsh-viz-thumb" }))),
            React.createElement("div", { className: "dsh-viz-path" },
              filePath ? "提示词文件：" + filePath : "提示词文件：$DSH_HOME/profiles/<profile>/.visualizer-widget/prompt.md",
              React.createElement("br"),
              promptReady
                ? "可在下方编辑并保存，或直接修改该文件；下一轮生效。"
                : promptPhase === "loading" ? "正在读取提示词…" : "无法读取提示词文件，可重试。"),
            promptPhase === "error"
              ? React.createElement("button", {
                  className: "dsh-viz-card-discard",
                  disabled: saving,
                  onClick: () => setReloadTick(reloadTick + 1)
                }, "重试读取")
              : null,
            React.createElement("textarea", {
              className: "dsh-viz-setting-input",
              value: prompt,
              rows: 10,
              disabled: !promptReady || saving,
              onChange: (e) => setPrompt(e.target.value)
            }),
            React.createElement("div", { className: "dsh-viz-card-footer" },
              React.createElement("span", { className: "dsh-viz-card-failed" }, flag),
              React.createElement("button", {
                className: "dsh-viz-card-discard",
                disabled: !dirty || saving,
                onClick: discard
              }, "放弃修改"),
              React.createElement("button", {
                className: "dsh-viz-card-save",
                disabled: !dirty || saving || !writable || promptInvalid,
                onClick: save
              }, saving ? "保存中…" : "保存")))
        : null;

      return React.createElement("li", {
        className: "dsh-viz-card" + (open ? " dsh-viz-card-open" : "")
      }, header, body);
    }

    function applySettingsCard(ctx) {
      // form 由 ConfigForms 服务持有并按 ns 缓存（provider-owned，服务卸载时统一 dispose）；
      // 本侧只 get、不 dispose——dispose 后 get 会拿到已死的缓存对象。
      const form = ctx.configForms.get(NS);
      ctx.effect(() => injectStyles(SETTINGS_CSS));
      // 宿主 serve 该命名空间期间才挂载卡片；未组合 host 半时不留痕迹。
      // whileServed 返回 disposer，由调用方包进 ctx.effect。
      return ctx.configForms.whileServed([NS], () => ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
        name: "plugins.bundle.config",
        key: BUNDLE_KEY,
        inject: () => ({ form }),
      }, SettingsCard)));
    }
