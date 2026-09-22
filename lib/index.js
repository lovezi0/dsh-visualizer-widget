// dsh-visualizer-widget — 把会话内联可视化能力移植进 DeepSeek Harness。
// host 半：注册两个工具。
//   - render_visual：把 SVG/HTML 源码渲染成会话流内联卡片（源码只进卡片，不回灌模型上下文）。
//   - get_visualizer_spec：按需返回统一渲染规范全文（生成源码前确认规范细节）。
import { readFileSync } from "node:fs";
import { defineTool } from "@deepseek-ai/dsh-tools";
import Schema from "@deepseek-ai/schemastery";

// cordis 服务名，必须与 cordis.patch.yml 的 insert.id 一致。
export const name = "visualizer-widget";
export const inject = ["tools", "systemPrompt"];

// 设置命名空间 = cordis 插件名（export name 'visualizer-widget'）。Config 含
// volatile 字段时宿主 settings 域自动 expose 该命名空间，client 半经
// ctx.configForms.get("visualizer-widget") 读写；此处无需注册代码。

// 精简版可视化渲染指令（注入系统提示词，可经设置面板关闭/改写）。
const DEFAULT_PROMPT =
  "[可视化指令] 用户要图表/示意图/流程图/架构图/UI 原型/看板时，【必须】调 render_visual 渲染成内联卡片；【禁止】直接输出 SVG/HTML 源码或用 write 写文件。SVG 遵循：viewBox 0 0 680 开头、高 ≤760px、横向布局、字号 ≥11px、字重 400/500。判定：想看图 → render_visual；明确要 .svg/.html 文件 → 才用 write。";

// 插件配置 schema：加载时校验，非法即失败。
// volatile 字段 = 即时配置：宿主 settings 域把它挂到命名空间 NS 上，
// 设置卡片经 configForms 写盘（cordis patch），cordis 负责热更新；
// 运行时读 config.x.get() 即当前权威值。需 @deepseek-ai/schemastery >= 3.18.3。
export const Config = Schema.object({
  enabled: Schema.boolean().default(true).description("是否把可视化渲染指令注入系统提示词。").volatile(),
  prompt: Schema.string().default(DEFAULT_PROMPT).description("注入系统提示词的可视化渲染指令文本。").volatile(),
});

// 源码长度上限：超长源码直接抛错，避免无谓回灌。
const MAX_CHARS = 200000;

// 渲染规范：src/references/visualizer-spec.md，build 后随 src 复制到 lib/references/，
// 相对 lib/index.js 定位（本包 main 入口）。
const SPEC_URL = new URL("./references/visualizer-spec.md", import.meta.url);

function detectFormat(source, declared) {
  if (declared === "svg" || declared === "html") return declared;
  return /<svg[\s>]/i.test(source) ? "svg" : "html";
}

function clampHeight(value) {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 420;
  return Math.min(1200, Math.max(160, n));
}

// ---- get_visualizer_spec：按需返回渲染规范全文 ----
const specTool = defineTool({
  name: "get_visualizer_spec",
  description:
    "返回可视化看板的统一设计规范全文。生成 SVG 或 HTML 源码前，若需确认规范细节——viewBox 基准 680、字号/字重约束、9×7 色板 hex、明暗模式配色、图类型路由、导出陷阱、Chart.js/D3 模板——调用此工具获取。规范是内联可视化设计规范的固化快照。",
  parameters: {},
  output: {
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        text: { type: "string", required: true },
        chars: { type: "integer", required: true },
      },
    },
    render: (_args, value) => [{ type: "text", text: value.text }],
  },
  async execute() {
    const text = readFileSync(SPEC_URL, "utf8");
    return { text, chars: text.length };
  },
});

// ---- render_visual：把 SVG/HTML 源码渲染成会话流内联卡片 ----
const renderTool = defineTool({
  name: "render_visual",
  description:
    "当用户需要图表（柱状/折线/饼图/散点等）、示意图、流程图、UI 原型、数据看板等可视化内容时，优先调用本工具把 SVG/HTML 源码内联渲染成会话流卡片，不要用 write 等文件工具把 SVG/HTML 写到工作区。本工具把源码交给浏览器渲染成可交互卡片（预览/源码切换、高度档位、浅色/深色底、重跑、复制），源码只进卡片、不会回灌到模型上下文。生成 SVG 时遵循 get_visualizer_spec 的核心规范：viewBox 以 0 0 680 开头、且高度务必控制在 760px 以内（卡片预览区高度预设为 280/420/560/760，请横向布局，饼图/柱状图/流程不要拉成竖长条，否则 760px 显示不全）、字号不小于 11px、字重只用 400/500、每图不超过 2 组色系、连线 path 必须 fill=none。",
  parameters: {
    source: {
      type: "string",
      required: true,
      description: "SVG 或 HTML 源码（可含 <style> 与 <script>）。HTML 片段会被自动补全成完整文档。",
    },
    format: {
      type: "string",
      enum: ["auto", "svg", "html"],
      description: "源码类型。默认 auto：检测到 <svg 即按 SVG 处理。",
    },
    title: {
      type: "string",
      description: "看板标题，显示在卡片头部。",
    },
    height: {
      type: "integer",
      description: "预览区初始高度（px，160–1200），默认 420。",
    },
  },
  output: {
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        ok: { type: "boolean", required: true },
        format: { type: "string", required: true },
        title: { type: "string", required: true },
        chars: { type: "integer", required: true },
        height: { type: "integer", required: true },
        source: { type: "string", required: true },
        notice: { type: "string" },
      },
    },
    render: (_args, value) => {
      const label = value.title || "未命名看板";
      const text =
        "已渲染可视化看板「" + label + "」：" + value.format.toUpperCase() + "，" + value.chars +
        " 字符，预览高度 " + value.height + "px。卡片已插入会话流，源码不进入模型上下文。" +
        (value.notice ? " 提示：" + value.notice : "");
      return [{ type: "text", text }];
    },
  },
  async execute(args) {
    const source = typeof args.source === "string" ? args.source : "";
    if (source.trim().length === 0) {
      throw new Error("source 不能为空：请传入要渲染的 SVG 或 HTML 源码。");
    }
    if (source.length > MAX_CHARS) {
      throw new Error("source 过长（" + source.length + " 字符，上限 " + MAX_CHARS + "）：请精简或拆分后再渲染。");
    }
    const format = detectFormat(source, args.format);
    const height = clampHeight(args.height);
    const value = {
      ok: true,
      format,
      title: typeof args.title === "string" ? args.title : "",
      chars: source.length,
      height,
      source,
    };
    if (format === "svg" && !/<svg[\s>]/i.test(source)) {
      value.notice = "声明为 SVG 但未找到 <svg> 标签，已按原样渲染。";
    }
    return value;
  },
});

export function apply(ctx, config) {
  // 可视化渲染指令：注入系统提示词（每轮生效；enabled=false 时注入空串）。
  // config.enabled/prompt 是 volatile 引用：设置卡片写盘后 cordis 热更新，
  // text() 每次求值读到当前权威值，无需本地状态源。
  ctx.systemPrompt.section({
    name: "visualizer-widget",
    order: 50,
    text: () => {
      const enabled = config.enabled.get();
      const prompt = config.prompt.get();
      return enabled !== false ? (typeof prompt === "string" ? prompt : DEFAULT_PROMPT) : "";
    },
  });

  ctx.tools.register(specTool);
  ctx.tools.register(renderTool);
}
