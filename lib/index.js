// dsh-visualizer-widget — 把会话内联可视化能力移植进 DeepSeek Harness。
// host 半：注册两个工具、一条会话命令；提示词存 profile 目录的 .visualizer-widget/prompt.md。
//   - render_visual：把 SVG/HTML 源码渲染成会话流内联卡片（源码只进卡片，不回灌模型上下文）。
//   - get_visualizer_spec：按需返回统一渲染规范全文（生成源码前确认规范细节）。
//   - /visual：会话命令，把需求交给模型并要求内联渲染（不依赖提示词注入开关）。
import { readFileSync } from "node:fs";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import Schema from "@deepseek-ai/schemastery";
import { ensurePromptFile, readPromptFile } from "./prompt-file.mjs";
import { registerPromptApi } from "./prompt-api.mjs";

// cordis 服务名，必须与 cordis.patch.yml 的 insert.id 一致。
export const name = "visualizer-widget";
export const inject = ["tools", "systemPrompt"];

// 设置命名空间 = cordis 插件名（export name 'visualizer-widget'）。Config 的
// enabled 仍是 volatile 字段，设置卡片经 ctx.configForms 读写该开关；提示词正文
// 不走 Config，而是 profile 目录下的 .visualizer-widget/prompt.md。

// 注入系统提示词的默认可视化指令：先教「何时该画」，再定「怎么画」。
// （无 per-turn IDE Theme 注入、无 widget_guidelines 模块加载、sendPrompt 为 no-op），
// 换成插件真实的工具名与卡片能力。
const DEFAULT_PROMPT = `[可视化] 可视化用这两个工具：get_visualizer_spec（取设计规范全文）、render_visual（把 SVG/HTML 渲染成会话内联卡片）。当一张图比一段话更清楚时，直接把图放进对话——不要用文字描述代替、不要贴源码、也不要用 write 写文件。

何时画（用户不必说「画」）：
- 显式：画…、画一个…、展示/可视化/图表/图解/示意图/架构图/流程图/原型/看板/对比表/时间线/关系图、「X 长什么样」。
- 教学：解释 X、教我 X、X 怎么运作——优先用图（概念、层级、流程、机制），抽象或多步的内容尤其如此，拿不准就画；纯词义查询（「X 是什么意思」）除外。
- 数据：比较、趋势、分布、占比、排序。
- 架构：设计/改造系统、梳理模块与数据流时，用一张图锚定讨论。
- 规格：用户只给一个成品名词短语（「带搜索的状态机」「REST 与 GraphQL 对比表」）时，这就是渲染请求而非讨论请求；用 Markdown 表格复述不算数。
例外：明确要文件/工件（.svg/.html/.png、PPT、文档等）、或要把图嵌进项目代码时，才用 write。

示例：「解释 TCP/IP 如何工作」→ 协议栈分层图，逐层配正文；「比较微服务和单体」→ 并排架构图；「画一个红色圆圈」→ 直接画。

怎么画：
1. 写源码前先调 get_visualizer_spec（一次返回全文，无参数），按其中的色板、图类型路由与硬性规则施工；出卡时给 title 一个能说明内容的短标题。
2. 复杂主题可拆成多张卡，每张讲一个概念；卡与卡之间要夹一句承接的正文，绝不连续堆卡片。
3. 解释写在卡片外，卡内只放视觉元素。
4. SVG：viewBox 以 0 0 680 开头、高 ≤760px、横向排布；字号 ≥11px、字重只用 400/500；每图 ≤2 组色系（art 插画除外）；连线 path 用 fill="none"。
5. 配色：SVG 形状用 c-teal 等 9 组色板 class，HTML 用 var(--color-*) 令牌——卡片可在浅底/深底间切换，写死 hex 会在另一种底色上失读；最外层容器保持透明，背景由宿主提供。
6. 默认不用渐变、阴影、emoji，也不写 HTML/CSS 注释；规范明示的例外（如 2.3 的一个 linearGradient、3.1 的功能性 focus ring）优先。

表达：直接说「这是它的流程图」再补一句要点；不要暴露工具调用或「加载规范」的过程，也不要说「生成图片」（产出是 SVG/HTML）。`;

// /visual 命令的一次性指令前缀：命令不依赖注入开关与 prompt.md，必须自带完整执行指令；
// 与全局注入（enabled 打开）同时生效时会有少量重叠，属可接受的冗余。
const COMMAND_PROMPT = `[可视化] 用 render_visual 把下面的需求渲染成会话内联卡片，不要只做文字描述、不要贴源码、也不要用 write 写文件。
步骤：先调 get_visualizer_spec 取规范全文（一次返回全部，无参数）→ 写 SVG/HTML 源码 → 调 render_visual 出卡，并给 title 一个短标题。
复杂主题可拆多张卡，卡间夹一句承接正文；解释与要点写在卡片外，不暴露工具调用或「加载规范」过程，也不说「生成图片」。对比表、时间线同样用卡片渲染，不要用 Markdown 表格替代。
硬约束：viewBox 以 0 0 680 开头、高 ≤760px、横向排布；字号 ≥11px、字重 400/500；每图 ≤2 组色系（art 插画除外）；连线 fill="none"；配色 SVG 用 c-* 类、HTML 用 var(--color-*)，最外层透明；不用渐变/阴影/emoji，也不写 HTML/CSS 注释（规范明示的例外除外）。
需求：`;

// 插件配置只保留开关；提示词正文唯一来源是 profile 目录的 .visualizer-widget/prompt.md。
// 0.4.0 起不再兼容旧的 Config.prompt 字段（破坏性变更）：配置文件里的 prompt 键会被忽略。
export const Config = Schema.object({
  enabled: Schema.boolean().default(false).description("是否把 .visualizer-widget/prompt.md 注入系统提示词（默认关闭）。").volatile(),
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
    "返回内联可视化设计规范全文（一次给全：公共底座 + diagram/mockup/interactive/chart/art 五个模块；无参数，无需重复调用）。写 SVG/HTML 源码前先调它——9×7 色板 hex 与 c-* 色板类、字号字重、viewBox 680 基准与高度上限、浅底/深底配色、图类型路由、Chart.js/D3 模板、硬性禁令与导出要点都在里面。规范随包分发，是固化的快照。",
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
    "把 SVG/HTML 源码渲染成会话流里的内联可视化卡片（预览/源码切换、高度档位、浅底/深底、弹出放大、重跑、下载、复制源码；SVG 可另存 PNG），源码只进卡片、不回灌模型上下文。用户要图表、示意图、流程图、架构图、UI 原型、数据看板、对比表、时间线，或让你解释偏概念/结构/流程的内容、比较两个方案时，优先用它把视觉直接放进对话——不要贴源码、不要用 write 写文件、也不要用文字描述代替。生成源码前先调 get_visualizer_spec 核对规范；渲染后在卡片外补一两句要点，多张图请逐张渲染并在卡间衔接。height 是预览区初始高度（160–1200，默认 420），选贴近内容固有高度的档位（280/420/560/760）；竖长内容请改横向布局，否则预览区放不下、需要滚动。",
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
      description: "预览区初始高度（px，160–1200，常用档位 280/420/560/760），默认 420。",
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

function errorText(error) {
  return error && error.message ? error.message : String(error);
}

function profileDirOf(ctx) {
  const profile = ctx.get("profileContext");
  return profile && typeof profile.dir === "string" && profile.dir.length > 0 ? profile.dir : undefined;
}

export function apply(ctx, config) {
  // 提示词正文只从 profile 目录的 .visualizer-widget/prompt.md 读取（唯一来源）。
  // 参考 dsh-memory-palace：插件私有落盘放 <profileContext.dir> 下，目录 0700 / 文件 0600。
  // 破坏性变更：不再读取 Config.prompt，避免与文件形成两份提示词。
  let promptFile;
  let promptText = DEFAULT_PROMPT;
  let prepared = false;
  let prepareFailed = false;

  const prepare = (profileDir) => {
    if (prepared || prepareFailed) return;
    try {
      const result = ensurePromptFile(profileDir, DEFAULT_PROMPT);
      promptFile = result.file;
      promptText = result.content || DEFAULT_PROMPT;
      prepared = true;
    } catch (error) {
      prepareFailed = true;
      ctx.logger?.warn?.("[visualizer-widget] 无法准备提示词文件：" + errorText(error));
    }
  };

  const initialDir = profileDirOf(ctx);
  if (initialDir) prepare(initialDir);
  else {
    // profileContext 由启动器提供；缺席（测试/非 dsh 宿主）时保持内置默认提示词。
    ctx.inject(["profileContext"], (profileCtx) => {
      const dir = profileDirOf(profileCtx);
      if (dir) prepare(dir);
    });
  }

  // 可视化渲染指令：注入系统提示词（每轮求值；enabled=false 时为空串）。
  // text() 必须是同步函数：每轮同步读 prompt.md，直接编辑文件后下一轮即生效。
  ctx.systemPrompt.section({
    name: "visualizer-widget",
    order: 50,
    text: () => {
      if (config.enabled.get() !== true) return "";
      if (!prepared && !prepareFailed) {
        const dir = profileDirOf(ctx);
        if (dir) prepare(dir);
      }
      if (promptFile) promptText = readPromptFile(promptFile, promptText);
      return promptText;
    },
  });

  // 设置页同源 route：读写 .visualizer-widget/prompt.md（可选依赖 webServer；
  // 无 Web 面的部署不加载子 fiber，文件仍可由用户直接编辑）。
  ctx.inject(["webServer"], (apiCtx) => {
    apiCtx.effect(() => registerPromptApi(apiCtx, DEFAULT_PROMPT), "visualizer-widget: prompt api");
  });

  // /visual：会话命令手动触发（不依赖 enabled 开关）。
  // commands 是可选依赖——只有组合了命令注册表的部署（web / desktop / CLI）才出现该命令；
  // 服务缺席时子 fiber 不加载，插件主体照常 ACTIVE，绝不 pending（0.1.7 settingsScope 事故的教训）。
  ctx.inject(["commands"], (commandCtx) => {
    commandCtx.effect(() => commandCtx.commands.register({
      name: "visual",
      description: "让模型用 render_visual 把图表/示意图/原型渲染成会话内联卡片",
      input: { hint: "<描述你想看什么>" },
      handler: ({ agent, rawInput }) => {
        const ask = rawInput.trim();
        if (ask === "") return { kind: "error", text: "用法：/visual <需求描述>" };
        try {
          agent.steer(createUserMessage({
            content: [{ type: "text", text: COMMAND_PROMPT + ask }],
            source: { kind: "user" },
          }));
        } catch (error) {
          return { kind: "error", text: "无法提交渲染请求：" + (error && error.message ? error.message : String(error)) };
        }
        return { kind: "success", text: "已交给模型渲染，卡片会出现在本次回复里。" };
      },
    }));
  });

  ctx.tools.register(specTool);
  ctx.tools.register(renderTool);
}
