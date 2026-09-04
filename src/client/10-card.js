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