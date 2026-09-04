    // ---- 设置卡片：settings.plugin.item（key = 命名空间），对齐官方 PluginCard 样式 ----
    const NS = "visualizer-widget";

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
      // 提示词文本框
      ".dsh-viz-setting-input{width:100%;box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l1);border-radius:8px;padding:8px 10px;font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);resize:vertical}",
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

    function SettingsCard(props) {
      const scope = props.scope;
      const snapState = React.useState(scope.getSnapshot());
      const snap = snapState[0];
      const setSnap = snapState[1];

      React.useEffect(() => scope.subscribe(() => setSnap(scope.getSnapshot())), []);

      const value = snap.value || {};
      const currentEnabled = value.enabled !== false;
      const currentPrompt = typeof value.prompt === "string" ? value.prompt : "";

      // 草稿：用户编辑后只进草稿，保存才写盘（staged + save + discard，与官方卡片一致）。
      const enabledState = React.useState(currentEnabled);
      const enabled = enabledState[0];
      const setEnabled = enabledState[1];
      const promptState = React.useState(currentPrompt);
      const prompt = promptState[0];
      const setPrompt = promptState[1];
      const savingState = React.useState(false);
      const saving = savingState[0];
      const setSaving = savingState[1];
      const flagState = React.useState("");
      const flag = flagState[0];
      const setFlag = flagState[1];
      const openState = React.useState(false);
      const open = openState[0];
      const setOpen = openState[1];

      const writable = snap.status === "ready" && snap.writable !== false;
      const dirty = enabled !== currentEnabled || prompt !== currentPrompt;

      const discard = () => {
        setEnabled(currentEnabled);
        setPrompt(currentPrompt);
        setFlag("");
      };

      const save = () => {
        if (!writable || !dirty || saving) return;
        setSaving(true);
        setFlag("");
        void Promise.all([
          scope.set("enabled", enabled),
          scope.set("prompt", prompt),
        ]).then(() => setFlag("已保存")).catch(() => setFlag("保存失败")).finally(() => setSaving(false));
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
            "把「优先用 render_visual 内联渲染」的指令注入系统提示词，引导模型对图表/原型需求直接渲染，而非输出源码或写文件。")),
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
            React.createElement("textarea", {
              className: "dsh-viz-setting-input",
              value: prompt,
              rows: 7,
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
                disabled: !dirty || saving || !writable,
                onClick: save
              }, saving ? "保存中…" : "保存")))
        : null;

      return React.createElement("li", {
        className: "dsh-viz-card" + (open ? " dsh-viz-card-open" : "")
      }, header, body);
    }

    function applySettingsCard(ctx) {
      const scope = ctx.settingsScope.bind({ namespace: NS });
      ctx.effect(() => injectStyles(SETTINGS_CSS));
      ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
        name: "settings.plugin.item",
        key: NS,
        inject: () => ({ scope })
      }, SettingsCard));
    }