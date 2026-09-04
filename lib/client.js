window.__ModuleLoader__.load({
  id: "dsh-visualizer-widget",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let React = require("react");


// ---- 卡片常量与工具函数 ----
    const TOOL = "render_visual";
    const HEIGHTS = [280, 420, 560, 760];
    const MAX_VIEW_CHARS = 20000;

    // 背景色固定 #f6f8fa；其余配色走 --dsw-alias-* 语义变量，自动跟随明暗主题。
    const CSS = [
      ".dsh-viz{border:.5px solid var(--dsw-alias-border-l1);border-radius:12px;background:#f6f8fa;margin:4px 0 4px 4px;overflow:hidden}",
      ".dsh-viz-head{display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;color:var(--dsw-alias-label-secondary);font-size:12px}",
      ".dsh-viz-title{color:var(--dsw-alias-label-primary);font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".dsh-viz-badge{border:.5px solid var(--dsw-alias-border-l2);border-radius:6px;padding:0 6px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);flex:none}",
      ".dsh-viz-badge[data-tone=\"live\"]{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}",
      ".dsh-viz-badge[data-tone=\"error\"]{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}",
      ".dsh-viz-tools{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:0 10px 8px}",
      ".dsh-viz-btn{border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);border-radius:6px;height:22px;padding:0 8px;font-size:11px;cursor:pointer}",
      ".dsh-viz-btn[data-on=\"true\"]{color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}",
      ".dsh-viz-grow{flex:1}",
      ".dsh-viz-body{padding:0 10px 10px}",
      ".dsh-viz-frame{display:block;width:100%;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:#fff}",
      ".dsh-viz-code{margin:0;padding:10px 12px;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;overflow:auto;white-space:pre-wrap;word-break:break-word}",
      ".dsh-viz-note{padding:10px 12px;border:.5px dashed var(--dsw-alias-border-l2);border-radius:10px;color:var(--dsw-alias-label-secondary);font-size:12px}"
    ].join("\n");

    // 一次性注入卡片样式（data-plugin 标记，随插件卸载移除）。
    function injectStyles(css) {
      const style = document.createElement("style");
      style.setAttribute("data-plugin", "dsh-visualizer-widget");
      style.textContent = css;
      document.head.appendChild(style);
      return () => style.remove();
    }

    function parseArgs(raw) {
      try {
        const value = JSON.parse(raw);
        return value && typeof value === "object" ? value : null;
      } catch (error) {
        return null;
      }
    }

    // 三级来源读源码：RunningToolCall 直接取 argsRaw；settled 取 block.call.argsRaw；
    // 窗口裁剪后调用头缺失 → null → 显示「源码不可用」。
    function callArgs(block) {
      if (!block) return null;
      if (typeof block.argsRaw === "string") return parseArgs(block.argsRaw);
      if (block.call && typeof block.call.argsRaw === "string") return parseArgs(block.call.argsRaw);
      return null;
    }

    function resultText(block) {
      const parts = [];
      const content = block && Array.isArray(block.content) ? block.content : [];
      for (const item of content) {
        if (item && item.type === "text" && typeof item.text === "string") parts.push(item.text);
      }
      return parts.join("\n");
    }

    function docFor(source, format, dark) {
      const bg = dark ? "#11141a" : "#ffffff";
      const fg = dark ? "#e7eaf0" : "#1b1f27";
      const base = "html,body{margin:0;padding:0;background:" + bg + ";color:" + fg + ";font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Microsoft YaHei\",sans-serif;}";
      if (format === "svg") {
        return "<!doctype html><html><head><meta charset=\"utf-8\"><style>" + base + "body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:12px;box-sizing:border-box;}svg{max-width:100%;height:auto;}</style></head><body>" + source + "</body></html>";
      }
      if (/<html[\s>]/i.test(source)) return source;
      return "<!doctype html><html><head><meta charset=\"utf-8\"><style>" + base + "body{padding:14px;box-sizing:border-box;}</style></head><body>" + source + "</body></html>";
    }

    function clampHeight(value) {
      const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 420;
      return Math.min(1200, Math.max(160, n));
    }

    // 触发浏览器下载文件（revokeObjectURL 防泄漏）。
    function triggerDownload(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    function Row(props) {
      const block = props.block;
      const args = callArgs(block);
      const settled = Boolean(block && block.kind === "tool-result");
      const failed = settled && block.isError === true;
      const source = args && typeof args.source === "string" ? args.source : "";
      const format = source ? (/<svg[\s>]/i.test(source) ? "svg" : "html") : "html";

      const viewState = React.useState("preview");
      const view = viewState[0];
      const setView = viewState[1];
      const heightState = React.useState(clampHeight(args ? args.height : 420));
      const height = heightState[0];
      const setHeight = heightState[1];
      const darkState = React.useState(false);
      const dark = darkState[0];
      const setDark = darkState[1];
      const nonceState = React.useState(0);
      const nonce = nonceState[0];
      const setNonce = nonceState[1];
      const copiedState = React.useState("");
      const copied = copiedState[0];
      const setCopied = copiedState[1];

      const title = (args && typeof args.title === "string" && args.title) || "未命名看板";
      const doc = source ? docFor(source, format, dark) : "";
      const shown = source.length > MAX_VIEW_CHARS
        ? source.slice(0, MAX_VIEW_CHARS) + "\n… [源码过长，仅显示前 " + MAX_VIEW_CHARS + " 字符]"
        : source;

      // 直接下载 SVG / HTML 源码文件。
      const downloadSource = () => {
        try {
          const mime = format === "svg" ? "image/svg+xml" : "text/html";
          const ext = format === "svg" ? "svg" : "html";
          triggerDownload(new Blob([source], { type: mime + ";charset=utf-8" }), "render-visual-" + Date.now() + "." + ext);
        } catch (error) {
          setCopied("下载失败");
        }
      };

      // 保存为图片：SVG 走 canvas → PNG；HTML 提示（无法 headless 截图）。
      const saveAsImage = () => {
        if (format === "svg") {
          try {
            const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
            const svgUrl = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.onload = () => {
              const w = img.naturalWidth || img.width || 800;
              const h = img.naturalHeight || img.height || 600;
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              ctx.fillStyle = dark ? "#11141a" : "#ffffff";
              ctx.fillRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              canvas.toBlob((pngBlob) => {
                if (pngBlob) {
                  triggerDownload(pngBlob, "render-visual-" + Date.now() + ".png");
                } else {
                  setCopied("保存失败");
                }
                URL.revokeObjectURL(svgUrl);
              }, "image/png");
            };
            img.onerror = () => {
              URL.revokeObjectURL(svgUrl);
              setCopied("保存失败");
            };
            img.src = svgUrl;
          } catch (error) {
            setCopied("保存失败");
          }
        } else {
          setCopied("HTML 请用浏览器截图");
        }
      };

      // 复制源码文本到剪贴板。
      const copySource = () => {
        let ok = false;
        try {
          if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            navigator.clipboard.writeText(source);
            ok = true;
          }
        } catch (error) {
          ok = false;
        }
        setCopied(ok ? "已复制" : "复制失败");
      };

      const head = React.createElement("div", { className: "dsh-viz-head" },
        React.createElement("span", { className: "dsh-viz-title" }, title),
        React.createElement("span", { className: "dsh-viz-badge" }, format.toUpperCase()),
        React.createElement("span", { className: "dsh-viz-badge" }, source.length + " 字符"),
        React.createElement("span", {
          className: "dsh-viz-badge",
          "data-tone": failed ? "error" : (settled ? "ok" : "live")
        }, failed ? "失败" : (settled ? "已渲染" : "渲染中"))
      );

      if (!source) {
        return React.createElement("div", { className: "dsh-viz" },
          head,
          React.createElement("div", { className: "dsh-viz-body" },
            React.createElement("div", { className: "dsh-viz-note" },
              failed ? ("渲染失败：" + (resultText(block) || "未知错误")) : "源码不可用（调用参数已落出会话窗口），无法渲染预览。")
          )
        );
      }

      const tools = React.createElement("div", { className: "dsh-viz-tools" },
        React.createElement("button", {
          className: "dsh-viz-btn",
          "data-on": view === "preview" ? "true" : "false",
          onClick: () => setView("preview")
        }, "预览"),
        React.createElement("button", {
          className: "dsh-viz-btn",
          "data-on": view === "source" ? "true" : "false",
          onClick: () => setView("source")
        }, "源码"),
        React.createElement("span", { className: "dsh-viz-badge" }, "高度"),
        HEIGHTS.map((h) => React.createElement("button", {
          key: "h" + h,
          className: "dsh-viz-btn",
          "data-on": height === h ? "true" : "false",
          onClick: () => setHeight(h)
        }, String(h))),
        React.createElement("span", { className: "dsh-viz-grow" }),
        React.createElement("button", {
          className: "dsh-viz-btn",
          "data-on": dark ? "true" : "false",
          onClick: () => setDark(!dark)
        }, dark ? "深底" : "浅底"),
        React.createElement("button", {
          className: "dsh-viz-btn",
          onClick: () => setNonce(nonce + 1)
        }, "重跑"),
        React.createElement("button", {
          className: "dsh-viz-btn",
          onClick: downloadSource
        }, "下载"),
        React.createElement("button", {
          className: "dsh-viz-btn",
          onClick: saveAsImage
        }, "保存为图片"),
        React.createElement("button", {
          className: "dsh-viz-btn",
          onClick: copySource
        }, copied || "复制源码")
      );

      const body = view === "preview"
        ? React.createElement("iframe", {
            key: "f" + nonce + "-" + dark,
            className: "dsh-viz-frame",
            style: { height: height + "px" },
            sandbox: "allow-scripts allow-popups allow-forms",
            srcDoc: doc,
            title: title
          })
        : React.createElement("pre", {
            className: "dsh-viz-code",
            style: { height: height + "px" }
          }, shown);

      return React.createElement("div", { className: "dsh-viz" },
        head,
        tools,
        React.createElement("div", { className: "dsh-viz-body" }, body)
      );
    }

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

    function apply(ctx) {
      ctx.effect(() => injectStyles(CSS));
      applySettingsCard(ctx);
      ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
        name: "tool.call.toolview",
        key: "render_visual"
      }, Row));
    }

    exports.apply = apply;
    exports.inject = ["slots", "settingsScope"];
    return module.exports;
  }
});
