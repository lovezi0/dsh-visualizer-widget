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
      ".dsh-viz-note{padding:10px 12px;border:.5px dashed var(--dsw-alias-border-l2);border-radius:10px;color:var(--dsw-alias-label-secondary);font-size:12px}",
      ".dsh-viz-chip{display:flex;align-items:center;gap:8px;margin:4px 0 4px 4px;padding:6px 10px;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base)}",
      ".dsh-viz-chip-name{color:var(--dsw-alias-label-primary);font-size:12px;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      // 弹出查看 dialog：原生 <dialog> + showModal 渲染在顶层，不受聊天容器 overflow 裁剪。
      ".dsh-viz-dialog{border:.5px solid var(--dsw-alias-border-l1);border-radius:12px;padding:0;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);width:min(1120px,94vw);height:min(880px,88vh);margin:auto}",
      ".dsh-viz-dialog[open]{display:flex;flex-direction:column}",
      ".dsh-viz-dialog::backdrop{background:rgba(8,10,14,.5)}",
      ".dsh-viz-dlg-head{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:.5px solid var(--dsw-alias-border-l2);flex:none}",
      ".dsh-viz-dlg-title{flex:1;min-width:0;font-size:14px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".dsh-viz-dlg-close{appearance:none;border:.5px solid var(--dsw-alias-border-l2);background:none;color:var(--dsw-alias-label-secondary);border-radius:8px;width:26px;height:26px;font-size:15px;line-height:1;cursor:pointer;flex:none}",
      ".dsh-viz-dlg-close:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}",
      ".dsh-viz-dlg-zoom{display:flex;align-items:center;gap:2px;flex:none}",
      ".dsh-viz-dlg-zbtn{appearance:none;border:.5px solid var(--dsw-alias-border-l2);background:none;color:var(--dsw-alias-label-secondary);border-radius:7px;min-width:24px;height:24px;padding:0 6px;font-size:13px;line-height:1;cursor:pointer}",
      ".dsh-viz-dlg-zbtn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}",
      ".dsh-viz-dlg-zval{min-width:54px;font-size:12px;font-variant-numeric:tabular-nums}",
      ".dsh-viz-dlg-view{position:relative;flex:1;min-height:0;padding:12px}",
      ".dsh-viz-dlg-body{display:flex;width:100%;height:100%;overflow:auto;overscroll-behavior:contain}",
      ".dsh-viz-dlg-body::-webkit-scrollbar{width:10px;height:10px}",
      ".dsh-viz-dlg-body::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2);border:3px solid transparent;border-radius:6px;background-clip:content-box}",
      ".dsh-viz-dlg-body::-webkit-scrollbar-track{background:transparent}",
      ".dsh-viz-dlg-stage{margin:auto;flex:none;overflow:hidden}",
      ".dsh-viz-dlg-hint{position:absolute;right:20px;bottom:18px;padding:2px 9px;border:.5px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);font-size:11px;opacity:.9;pointer-events:none}",
      ".dsh-viz-dlg-frame{display:block;border:.5px solid var(--dsw-alias-border-l1);border-radius:10px;background:#fff}"
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

    // ---- iframe 兼容层：规范 CSS 变量 + 预置 class + sendPrompt 桩 ----
    // 模型按规范（WorkBuddy visualizer 快照）生成源码，会引用 --color-* 变量与
    // t/box/c-* 等预置 class；但 iframe srcdoc 是独立文档，宿主变量不透传，
    // var() 解析失败时 fill 回落黑色（症状：色块全黑）。此处按规范 1.6/1.7/1.9
    // 在文档内重建这套令牌，深浅底随卡片「浅底/深底」切换。
    const RAMPS = {
      purple: ["#EEEDFE","#CECBF6","#AFA9EC","#7F77DD","#534AB7","#3C3489","#26215C"],
      teal:   ["#E1F5EE","#9FE1CB","#5DCAA5","#1D9E75","#0F6E56","#085041","#04342C"],
      coral:  ["#FAECE7","#F5C4B3","#F0997B","#D85A30","#993C1D","#712B13","#4A1B0C"],
      pink:   ["#FBEAF0","#F4C0D1","#ED93B1","#D4537E","#993556","#72243E","#4B1528"],
      gray:   ["#F1EFE8","#D3D1C7","#B4B2A9","#888780","#5F5E5A","#444441","#2C2C2A"],
      blue:   ["#E6F1FB","#B5D4F4","#85B7EB","#378ADD","#185FA5","#0C447C","#042C53"],
      green:  ["#EAF3DE","#C0DD97","#97C459","#639922","#3B6D11","#27500A","#173404"],
      amber:  ["#FAEEDA","#FAC775","#EF9F27","#BA7517","#854F0B","#633806","#412402"],
      red:    ["#FCEBEB","#F7C1C1","#F09595","#E24B4A","#A32D2D","#791F1F","#501313"]
    };

    function themeVars(dark) {
      const font = ";--font-sans:-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Microsoft YaHei\",sans-serif"
        + ";--font-serif:Georgia,\"Times New Roman\",serif"
        + ";--font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace"
        + ";--border-radius-md:8px;--border-radius-lg:12px;--border-radius-xl:16px";
      return dark
        ? ":root{--color-background-primary:#11141a;--color-background-secondary:#1a1e27;--color-background-tertiary:#0c0f14"
          + ";--color-background-info:#042C53;--color-background-danger:#501313;--color-background-success:#173404;--color-background-warning:#412402"
          + ";--color-text-primary:#e7eaf0;--color-text-secondary:#a8aeb9;--color-text-tertiary:#7c828e"
          + ";--color-text-info:#B5D4F4;--color-text-danger:#F09595;--color-text-success:#97C459;--color-text-warning:#FAC775"
          + ";--color-border-tertiary:rgba(231,234,240,.15);--color-border-secondary:rgba(231,234,240,.3);--color-border-primary:rgba(231,234,240,.4)"
          + ";--color-border-info:#185FA5;--color-border-danger:#A32D2D;--color-border-success:#3B6D11;--color-border-warning:#854F0B"
          + font + "}"
        : ":root{--color-background-primary:#ffffff;--color-background-secondary:#f6f8fa;--color-background-tertiary:#eef1f4"
          + ";--color-background-info:#E6F1FB;--color-background-danger:#FCEBEB;--color-background-success:#EAF3DE;--color-background-warning:#FAEEDA"
          + ";--color-text-primary:#1b1f27;--color-text-secondary:#5f636b;--color-text-tertiary:#8a8f98"
          + ";--color-text-info:#185FA5;--color-text-danger:#A32D2D;--color-text-success:#3B6D11;--color-text-warning:#854F0B"
          + ";--color-border-tertiary:rgba(27,31,39,.15);--color-border-secondary:rgba(27,31,39,.3);--color-border-primary:rgba(27,31,39,.4)"
          + ";--color-border-info:#185FA5;--color-border-danger:#A32D2D;--color-border-success:#3B6D11;--color-border-warning:#854F0B"
          + font + "}";
    }

    function compatCss(dark) {
      const lines = [
        ".t{font-family:var(--font-sans);font-size:14px;font-weight:400;fill:var(--color-text-primary);color:var(--color-text-primary)}",
        ".ts{font-family:var(--font-sans);font-size:12px;font-weight:400;fill:var(--color-text-secondary);color:var(--color-text-secondary)}",
        ".th{font-family:var(--font-sans);font-size:14px;font-weight:500;fill:var(--color-text-primary);color:var(--color-text-primary)}",
        ".box{fill:var(--color-background-secondary);stroke:var(--color-border-tertiary);background:var(--color-background-secondary);border:.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md)}",
        ".node{cursor:pointer}.node:hover{opacity:.85}",
        ".arr{fill:none;stroke:var(--color-text-secondary);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}",
        ".leader{fill:none;stroke:var(--color-border-secondary);stroke-width:.5;stroke-dasharray:4 4}",
        ".sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}"
      ];
      for (const name of Object.keys(RAMPS)) {
        const s = RAMPS[name];
        // 浅色：50 填充 + 600 描边 + 800 标题 / 600 副标题；深色：800 + 200 + 100 / 200。
        const fill = dark ? s[5] : s[0];
        const stroke = dark ? s[2] : s[4];
        const title = dark ? s[1] : s[5];
        const sub = dark ? s[2] : s[4];
        lines.push(
          ".c-" + name + "{fill:" + fill + ";stroke:" + stroke + ";stroke-width:.5}",
          ".c-" + name + " text{fill:" + title + "}",
          ".c-" + name + " .ts{fill:" + sub + "}"
        );
      }
      return themeVars(dark) + lines.join("");
    }

    // sendPrompt 桩：规范里的交互钩子在沙箱 iframe 内无宿主实现，给 no-op 防 ReferenceError。
    const STUB_SCRIPT = "<script>window.sendPrompt=window.sendPrompt||function(){};<\/script>";

    // 滚轮桥：sandbox iframe 内的事件不冒泡到父文档，父页面也无权在 iframe 文档里挂监听
    // （未开 allow-same-origin），故由 iframe 内部脚本把滚轮转成 postMessage 上报。
    // 默认**关闭**：先发 hello 征询，父页面（仅弹出态）回 enable 才接管，避免预览态把聊天页滚动吞掉。
    // 未放大且 iframe 内部还能滚时放行原生滚动，保证长内容照常可读。
    // 平移已移除：弹出态只支持滚轮缩放，放大后拖容器滚动条浏览。
    const BRIDGE_SCRIPT = "<script>(function(){"
      + "var on=false,k=1;"
      + "function root(){return document.scrollingElement||document.documentElement;}"
      + "function send(m){try{parent.postMessage(m,'*');}catch(e){}}"
      + "addEventListener('message',function(e){var d=e.data||{};"
      + "if(d.type==='dsh-viz-bridge'){on=d.on===true;}"
      + "else if(d.type==='dsh-viz-zoom'){k=Number(d.k)||1;}});"
      + "addEventListener('wheel',function(e){"
      + "if(!on)return;"
      + "var r=root();"
      + "var room=(e.deltaY>0? r.scrollTop+r.clientHeight<r.scrollHeight-1 : r.scrollTop>1);"
      + "if(k===1&&room)return;"
      + "e.preventDefault();"
      + "send({type:'dsh-viz-wheel',dy:e.deltaY,x:e.clientX,y:e.clientY});"
      + "},{passive:false});"
      + "function report(){send({type:'dsh-viz-size',w:document.documentElement.scrollWidth||0,h:document.documentElement.scrollHeight||0});}"
      + "send({type:'dsh-viz-bridge-hello'});"
      + "if(document.readyState==='complete'){setTimeout(report,0);}else{addEventListener('load',function(){setTimeout(report,0);});}"
      + "})();<\/script>";

    // 弹出态缩放区间与步进。
    const ZOOM_MIN = 0.25;
    const ZOOM_MAX = 6;
    const ZOOM_STEP = 1.25;

    function docFor(source, format, dark) {
      const bg = dark ? "#11141a" : "#ffffff";
      const fg = dark ? "#e7eaf0" : "#1b1f27";
      const base = "html,body{margin:0;padding:0;background:" + bg + ";color:" + fg + ";font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",\"Microsoft YaHei\",sans-serif;}";
      const compat = compatCss(dark);
      if (format === "svg") {
        return "<!doctype html><html><head><meta charset=\"utf-8\"><style>" + base + compat + "body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:12px;box-sizing:border-box;}svg{max-width:100%;height:auto;}</style></head><body>" + STUB_SCRIPT + source + BRIDGE_SCRIPT + "</body></html>";
      }
      if (/<html[\s>]/i.test(source)) {
        // 完整 HTML 文档：把兼容层注入 <head>（模型可能自带 var()/预置 class）。
        const inject = "<style>" + compat + "</style>" + STUB_SCRIPT;
        const tail = BRIDGE_SCRIPT;
        if (/<\/body\s*>/i.test(source)) return source.replace(/<\/body\s*>/i, function (m) { return tail + m; }).replace(/<head(\s[^>]*)?>/i, function (m) { return m + inject; });
        if (/<head(\s[^>]*)?>/i.test(source)) return source.replace(/<head(\s[^>]*)?>/i, function (m) { return m + inject; }) + tail;
        if (/<html(\s[^>]*)?>/i.test(source)) return source.replace(/<html(\s[^>]*)?>/i, function (m) { return m + "<head>" + inject + "</head>"; }) + tail;
        return inject + source + tail;
      }
      return "<!doctype html><html><head><meta charset=\"utf-8\"><style>" + base + compat + "body{padding:14px;box-sizing:border-box;}</style></head><body>" + STUB_SCRIPT + source + BRIDGE_SCRIPT + "</body></html>";
    }

    // 把源码改造成「脱离宿主也能正确渲染」的自包含 SVG，供下载与光栅化共用：
    // ① 补 xmlns —— 规范只要求 viewBox/width，模型输出通常不带命名空间；存成 .svg 文件
    //    用 XML 解析会因缺命名空间直接失败（白图），<img> 光栅化同样画不出来。
    // ② 内联兼容层 <style> —— .c-*/var(--color-*) 的唯一定义处；缺了色块全黑。
    // ③ width="100%" 换成 viewBox 像素尺寸 —— 否则 <img> 无可解析的固有尺寸，
    //    回落 300×150 默认值，导出图被压成缩略图。
    function exportSvg(source, dark) {
      const open = /<svg\b[^>]*>/i.exec(source);
      if (!open) return source;
      const original = open[0];
      let tag = original;
      const vb = /viewBox\s*=\s*["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s*["']/i.exec(tag);
      const w = vb ? Math.round(parseFloat(vb[1])) : 0;
      const h = vb ? Math.round(parseFloat(vb[2])) : 0;
      if (!/\sxmlns\s*=/i.test(tag)) tag = tag.replace(/^<svg/i, "<svg xmlns=\"http://www.w3.org/2000/svg\"");
      if (/xlink:href/i.test(source) && !/xmlns:xlink\s*=/i.test(tag)) {
        tag = tag.replace(/^<svg/i, "<svg xmlns:xlink=\"http://www.w3.org/1999/xlink\"");
      }
      if (w > 0 && h > 0) {
        // \swidth 不会误伤 stroke-width（其前一个字符是 -，非空白）。
        tag = /\swidth\s*=/i.test(tag)
          ? tag.replace(/\swidth\s*=\s*["'][^"']*["']/i, " width=\"" + w + "\"")
          : tag.replace(/^<svg/i, "<svg width=\"" + w + "\"");
        tag = /\sheight\s*=/i.test(tag)
          ? tag.replace(/\sheight\s*=\s*["'][^"']*["']/i, " height=\"" + h + "\"")
          : tag.replace(/^<svg/i, "<svg height=\"" + h + "\"");
      }
      const rebuilt = tag + "<style>" + compatCss(dark) + "</style>";
      // 必须用 original.length 切片——tag 已被改写变长，误用会吃掉正文开头。
      return source.slice(0, open.index) + rebuilt + source.slice(open.index + original.length);
    }

    // 内容的固有尺寸。弹出态把 iframe 视口定成它，而不是跟着 dialog 宽度走：
    // 视口 = 固有尺寸时内容刚好铺满视口（内部永不滚动 → 不会有怪异的内部滚动条），
    // 缩放才是真的「放大/缩小内容」（缩小能看见更多，而不是把同一块画面压小）。
    function naturalSize(source, format) {
      if (format !== "svg") return null;
      const vb = /viewBox\s*=\s*["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s*["']/i.exec(source);
      if (vb) return { w: Math.max(1, Math.round(parseFloat(vb[1]))), h: Math.max(1, Math.round(parseFloat(vb[2]))) };
      const wm = /\swidth\s*=\s*["']([0-9.]+)/i.exec(source);
      const hm = /\sheight\s*=\s*["']([0-9.]+)/i.exec(source);
      if (wm && hm) return { w: Math.round(parseFloat(wm[1])), h: Math.round(parseFloat(hm[1])) };
      return null;
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
      // 弹出查看：dialog 仅在打开时挂载 iframe（避免常驻双 iframe 渲染开销）。
      const popupState = React.useState(false);
      const popup = popupState[0];
      const setPopup = popupState[1];
      const zoomState = React.useState(1);
      const zoom = zoomState[0];
      const setZoom = zoomState[1];
      // 基尺寸 = iframe 视口尺寸。SVG 取 viewBox（固有尺寸）；HTML 无固有尺寸，
      // 先按 dialog 体量兜底，再由桥接脚本上报的真实内容尺寸纠正。
      const nat = naturalSize(source, format);
      const natKey = nat ? nat.w + "x" + nat.h : "";
      const baseState = React.useState(nat || { w: 680, h: 420 });
      const base = baseState[0];
      const setBase = baseState[1];
      const dlgRef = React.useRef(null);
      const frameRef = React.useRef(null);
      const boxRef = React.useRef(null);
      const zoomRef = React.useRef(1);
      const anchorRef = React.useRef(null);
      const sizedRef = React.useRef(false);

      const clampZoom = (v) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v));
      const setZoomBoth = (v) => { zoomRef.current = v; setZoom(v); };

      // 缩放并让光标下的内容点保持不动（未给锚点时按视口中心）。
      const zoomTo = (nextRaw, mx, my) => {
        const el = boxRef.current;
        const prev = zoomRef.current;
        const next = clampZoom(nextRaw);
        if (Math.abs(next - prev) < 0.0001) return;
        const ax = typeof mx === "number" ? mx : (el ? el.clientWidth / 2 : 0);
        const ay = typeof my === "number" ? my : (el ? el.clientHeight / 2 : 0);
        if (el) anchorRef.current = { cx: (el.scrollLeft + ax) / prev, cy: (el.scrollTop + ay) / prev, mx: ax, my: ay };
        setZoomBoth(next);
      };

      // 打开时「适应窗口」：整幅内容可见（contain），但不无脑放大（上限 250%）。
      const fitTo = (b) => {
        const el = boxRef.current;
        if (!el || !b || !b.w || !b.h) { zoomTo(1, 0, 0); return; }
        const vw = el.clientWidth, vh = el.clientHeight;
        if (!vw || !vh) { zoomTo(1, 0, 0); return; }
        zoomTo(Math.min(2.5, Math.min(vw / b.w, vh / b.h)), 0, 0);
      };

      // 锚点补偿放在 layout 阶段（DOM 已更新、尚未绘制），避免缩放时闪一下再归位。
      React.useLayoutEffect(() => {
        const a = anchorRef.current;
        if (!a) return;
        anchorRef.current = null;
        const el = boxRef.current;
        if (!el) return;
        el.scrollLeft = a.cx * zoom - a.mx;
        el.scrollTop = a.cy * zoom - a.my;
      }, [zoom]);

      // 打开/关闭由 React state 单向驱动，杜绝原生关闭造成的失同步（否则 state 卡 true，
      // 再点「弹出」时 setPopup(true) 值未变→React 跳过重渲染→showModal 永不调用）。
      // ESC：拦截原生 cancel（preventDefault 阻止浏览器直接关）→ 改由 state 关闭。
      // 必须是 layout effect：紧随其后的「适应窗口」要在同一提交里量尺寸，
      // 若 showModal 延到 passive effect，届时 dialog 仍 display:none，会量到 0。
      React.useLayoutEffect(() => {
        const dlg = dlgRef.current;
        if (!dlg || !popup) return;
        const onCancel = (e) => { e.preventDefault(); setPopup(false); };
        dlg.addEventListener("cancel", onCancel);
        if (!dlg.open) { try { dlg.showModal(); } catch (e) { setPopup(false); } }
        return () => {
          dlg.removeEventListener("cancel", onCancel);
          if (dlg.open) dlg.close();
        };
      }, [popup]);

      // 打开时定基尺寸并适应窗口。放 layout 阶段（showModal 之后、绘制之前），避免先闪一帧未适应。
      React.useLayoutEffect(() => {
        if (!popup) return;
        sizedRef.current = false;
        const el = boxRef.current;
        let b = nat;
        if (!b && el) b = { w: Math.max(200, el.clientWidth || 680), h: Math.max(120, el.clientHeight || 420) };
        if (!b) return;
        if (!nat) setBase(b);
        fitTo(b);
      }, [popup]);

      // 弹出态：接 iframe 上报的滚轮（见 BRIDGE_SCRIPT 注释），并把当前倍率同步回 iframe。
      React.useEffect(() => {
        if (!popup) return;
        const frame = frameRef.current;
        const box = boxRef.current;
        const post = (msg) => { try { const w = frame && frame.contentWindow; if (w) w.postMessage(msg, "*"); } catch (e) {} };

        const onMessage = (e) => {
          const w = frame && frame.contentWindow;
          if (!w || e.source !== w) return;
          const d = e.data || {};
          const k = zoomRef.current;
          if (d.type === "dsh-viz-bridge-hello") { post({ type: "dsh-viz-bridge", on: true }); post({ type: "dsh-viz-zoom", k: k }); return; }
          if (d.type === "dsh-viz-size") {
            // HTML 无固有尺寸：用上报的真实内容尺寸做基尺寸，内部即不再滚动。
            if (nat || sizedRef.current) return;
            const sw = Math.round(Number(d.w) || 0), sh = Math.round(Number(d.h) || 0);
            if (sw < 200 || sh < 100) return;
            sizedRef.current = true;
            const b = { w: Math.min(4000, sw), h: Math.min(4000, sh) };
            setBase(b);
            fitTo(b);
            return;
          }
          if (d.type === "dsh-viz-wheel") {
            // iframe 坐标系已被 scale(k) 放大，换算回父页面坐标再求视口内偏移。
            const r = frame.getBoundingClientRect();
            const br = box ? box.getBoundingClientRect() : r;
            const mx = r.left + (Number(d.x) || 0) * k - br.left;
            const my = r.top + (Number(d.y) || 0) * k - br.top;
            zoomTo(k * Math.exp(-(Number(d.dy) || 0) * 0.0016), mx, my);
            return;
          }
        };

        // 缩放后舞台小于视口时，光标可能落在 iframe 之外——这里兜住空白区的滚轮。
        const onBoxWheel = (e) => {
          if (!box) return;
          e.preventDefault();
          const br = box.getBoundingClientRect();
          zoomTo(zoomRef.current * Math.exp(-(Number(e.deltaY) || 0) * 0.0016), e.clientX - br.left, e.clientY - br.top);
        };

        window.addEventListener("message", onMessage);
        if (box) box.addEventListener("wheel", onBoxWheel, { passive: false });
        post({ type: "dsh-viz-bridge", on: true });
        post({ type: "dsh-viz-zoom", k: zoomRef.current });
        return () => {
          window.removeEventListener("message", onMessage);
          if (box) box.removeEventListener("wheel", onBoxWheel);
        };
      }, [popup]);

      // 倍率 / iframe 重建（重跑、切主题）后同步授权与当前倍率给桥接脚本。
      React.useEffect(() => {
        if (!popup) return;
        const frame = frameRef.current;
        try {
          const w = frame && frame.contentWindow;
          if (w) { w.postMessage({ type: "dsh-viz-bridge", on: true }, "*"); w.postMessage({ type: "dsh-viz-zoom", k: zoom }, "*"); }
        } catch (e) {}
      }, [popup, zoom, nonce, dark]);

      // iframe 重建后允许新的尺寸上报（HTML 基尺寸随新文档重算）。
      React.useEffect(() => { sizedRef.current = false; }, [nonce, dark]);

      // 源码流式到达时 viewBox 可能变，基尺寸要跟着走（弹窗开着就重新适应）。
      React.useEffect(() => {
        if (!nat) return;
        setBase(nat);
        if (popup) fitTo(nat);
      }, [natKey]);

      const title = (args && typeof args.title === "string" && args.title) || "未命名看板";
      const doc = source ? docFor(source, format, dark) : "";
      const shown = source.length > MAX_VIEW_CHARS
        ? source.slice(0, MAX_VIEW_CHARS) + "\n… [源码过长，仅显示前 " + MAX_VIEW_CHARS + " 字符]"
        : source;

      // 下载文件：SVG 走自包含改造（补 xmlns + 兼容层 + 像素尺寸，脱离宿主也能正常看）；
      // HTML 下载完整文档而非裸片段，否则兼容层缺失、样式全丢。
      const downloadSource = () => {
        try {
          if (format === "svg") {
            triggerDownload(new Blob([exportSvg(source, dark)], { type: "image/svg+xml;charset=utf-8" }), "render-visual-" + Date.now() + ".svg");
          } else {
            triggerDownload(new Blob([docFor(source, "html", dark)], { type: "text/html;charset=utf-8" }), "render-visual-" + Date.now() + ".html");
          }
        } catch (error) {
          setCopied("下载失败");
        }
      };

      // 保存为图片：SVG 经 canvas 光栅化为 PNG（2x 缩放，HiDPI 下发虚）。
      // 必须用 exportSvg 而非裸源码——缺兼容层会整片黑，缺 xmlns/固有尺寸则画不出来或成缩略图。
      const saveAsImage = () => {
        if (format !== "svg") {
          setCopied("HTML 请用浏览器截图");
          return;
        }
        let svgUrl = "";
        const cleanup = () => { if (svgUrl) URL.revokeObjectURL(svgUrl); svgUrl = ""; };
        try {
          svgUrl = URL.createObjectURL(new Blob([exportSvg(source, dark)], { type: "image/svg+xml;charset=utf-8" }));
          const img = new Image();
          img.onload = () => {
            try {
              const w = Math.round(img.naturalWidth || img.width || 680);
              const h = Math.round(img.naturalHeight || img.height || 420);
              const scale = 2;
              const canvas = document.createElement("canvas");
              canvas.width = w * scale;
              canvas.height = h * scale;
              const ctx = canvas.getContext("2d");
              if (!ctx) throw new Error("no 2d context");
              ctx.fillStyle = dark ? "#11141a" : "#ffffff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((pngBlob) => {
                if (pngBlob) triggerDownload(pngBlob, "render-visual-" + Date.now() + ".png");
                else setCopied("保存失败");
                cleanup();
              }, "image/png");
            } catch (error) {
              // 含 foreignObject / 外链资源的 SVG 会污染 canvas，toBlob 抛 SecurityError。
              cleanup();
              setCopied("保存失败，请改用下载");
            }
          };
          img.onerror = () => {
            cleanup();
            setCopied("保存失败（源码非合法 SVG）");
          };
          img.src = svgUrl;
        } catch (error) {
          cleanup();
          setCopied("保存失败");
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
          "data-on": popup ? "true" : "false",
          onClick: () => setPopup(true)
        }, "弹出"),
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

      const card = React.createElement("div", { className: "dsh-viz" },
        head,
        tools,
        React.createElement("div", { className: "dsh-viz-body" }, body)
      );

      // 弹出查看 dialog：showModal 后进入浏览器顶层，天然规避聊天容器 overflow 裁剪。
      // 关闭三途径：① 右上角按钮；② 原生 ESC（close 事件回写 state）；③ 点击遮罩——
      // 遮罩点击的 target 即 dialog 本身且坐标落在其 rect 外，据此判定。
      const dialog = React.createElement("dialog", {
        ref: dlgRef,
        className: "dsh-viz-dialog",
        "aria-label": title,
        onClick: (e) => {
          const dlg = dlgRef.current;
          if (!dlg) return;
          const r = dlg.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
            setPopup(false);
          }
        }
      },
        React.createElement("div", { className: "dsh-viz-dlg-head" },
          React.createElement("span", { className: "dsh-viz-dlg-title" }, title),
          React.createElement("span", { className: "dsh-viz-badge" }, format.toUpperCase()),
          React.createElement("span", { className: "dsh-viz-badge" }, source.length + " 字符"),
          React.createElement("span", { className: "dsh-viz-dlg-zoom" },
            React.createElement("button", {
              type: "button", className: "dsh-viz-dlg-zbtn", title: "缩小", "aria-label": "缩小",
              onClick: () => zoomTo(zoomRef.current / ZOOM_STEP)
            }, "−"),
            React.createElement("button", {
              type: "button", className: "dsh-viz-dlg-zbtn dsh-viz-dlg-zval", title: "重置为 100%",
              onClick: () => zoomTo(1)
            }, Math.round(zoom * 100) + "%"),
            React.createElement("button", {
              type: "button", className: "dsh-viz-dlg-zbtn", title: "放大", "aria-label": "放大",
              onClick: () => zoomTo(zoomRef.current * ZOOM_STEP)
            }, "+")
          ),
          React.createElement("button", {
            type: "button",
            className: "dsh-viz-dlg-close",
            "aria-label": "关闭",
            onClick: () => setPopup(false)
          }, "×")
        ),
        React.createElement("div", { className: "dsh-viz-dlg-view" },
          React.createElement("div", { className: "dsh-viz-dlg-body", ref: boxRef },
            popup ? React.createElement("div", {
              className: "dsh-viz-dlg-stage",
              style: { width: base.w * zoom + "px", height: base.h * zoom + "px" }
            },
              React.createElement("iframe", {
                ref: frameRef,
                className: "dsh-viz-dlg-frame",
                style: {
                  width: base.w + "px",
                  height: base.h + "px",
                  transform: "scale(" + zoom + ")",
                  transformOrigin: "0 0"
                },
                sandbox: "allow-scripts allow-popups allow-forms",
                srcDoc: doc,
                title: title
              })
            ) : null
          ),
          React.createElement("span", { className: "dsh-viz-dlg-hint" }, "滚轮缩放")
        )
      );

      return React.createElement(React.Fragment, null, card, dialog);
    }

    // 工具调用块内的紧凑状态行：宿主对工具块有高度限制（ToolRow .bodyScroll
    // max-height:260px），完整卡片已移到消息流（conversation.chat.node），
    // 这里只留一行状态，提示「可视化卡片见下方」。
    function ChipRow(props) {
      const block = props.block;
      const args = callArgs(block);
      const settled = Boolean(block && block.kind === "tool-result");
      const failed = settled && block.isError === true;
      const source = args && typeof args.source === "string" ? args.source : "";
      const format = source ? (/<svg[\s>]/i.test(source) ? "svg" : "html") : "html";
      const title = (args && typeof args.title === "string" && args.title) || "未命名看板";
      return React.createElement("div", { className: "dsh-viz-chip" },
        React.createElement("span", { className: "dsh-viz-chip-name" }, title),
        React.createElement("span", { className: "dsh-viz-badge" }, format.toUpperCase()),
        React.createElement("span", { className: "dsh-viz-badge" }, source.length + " 字符"),
        React.createElement("span", {
          className: "dsh-viz-badge",
          "data-tone": failed ? "error" : (settled ? "ok" : "live")
        }, failed ? "失败" : (settled ? "卡片见下方" : "渲染中"))
      );
    }
