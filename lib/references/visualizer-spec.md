# Visualizer 设计规范

**本文件是 harness 规范唯一来源。** 在具备 `read_me` 的宿主上，请直接用 `read_me` 拉实时版本，不要读这份快照。

---

## 0. 模块加载机制（重要）

`read_me` 的返回 = **公共底座（恒定）+ 模块增量（叠加）**。

- 公共底座：无论传什么模块，都会返回（设计哲学 / 通用规则 / CSS 变量 / 色板 / SVG 通用规则 / 预置 class / 字号校准）
- 模块增量：按 `modules` 数组里的值追加，可一次传多个，去重后拼接

| modules 值 | 实际追加的段落 | 解决什么问题 |
|---|---|---|
| `diagram` | Diagram Guidance（流程图 / 结构图 / 示意画 / 类型路由表） | 概念、层级、流程、系统结构 |
| `mockup` | UI Components（设计令牌、卡片、布局、3 种 Pattern） | UI 界面原型、数据记录卡、对比卡片 |
| `interactive` | Interactive Guidance | 滑块/按钮/stepper/动态计算 |
| `chart` | Charts (Chart.js) + Geographic maps (D3 choropleth) | 数据图表、地理可视化 |
| `art` | Art and illustration | 装饰性插画（**规则豁免区**） |

已知瑕疵：`interactive` 模块的段落会被**重复返回两次**（服务端拼接未去重），不影响使用。

---

## 1. 公共底座

### 1.1 设计哲学

- **Seamless**：用户不该察觉宿主 UI 与 widget 的边界
- **Flat**：无渐变、无网格背景、无噪点纹理、无装饰效果，纯平表面
- **Compact**：核心内容内联展示，其余用文字说明
- **文字归响应，视觉归工具**：所有解释性文字写在工具调用**之外**的正常回复中，工具输出只含视觉元素

### 1.2 流式输出约束

- 逐 token 流式渲染，因此结构要让有效内容**尽早出现**
- HTML 顺序：`<style>`（短）→ 内容 HTML → `<script>` 放最后
- SVG 顺序：`<defs>`（marker）→ 立刻画视觉元素
- 优先内联 `style="..."`，少用 `<style>` 块；`<style>` 控制在 15 行内
- 渐变/阴影/模糊在流式 DOM diff 时会闪烁 → 用纯色填充

### 1.3 硬性规则

- 禁止 `<!-- 注释 -->` 和 `/* 注释 */`
- 字号不得小于 11px
- 禁止 emoji（用 CSS 形状或 SVG path 代替）
- 禁止渐变、投影、模糊、发光、霓虹效果
- 外层容器不得用深色/彩色背景（透明，由宿主提供背景）
- **字号规范**：h1=15px，h2=14px，h3=13px，均 `font-weight: 500`；正文 13px / 400 / `line-height: 1.6`
- **只有两种字重**：400（常规）、500（加粗）。绝不使用 600 或 700
- 一律 sentence case，不用 Title Case，不用全大写
- 禁止 `position: fixed`
- 不写 DOCTYPE、`<html>`、`<head>`、`<body>`，只输出内容片段
- **本地图片**：用绝对路径引用（`<img src="/abs/path.png">`，SVG 用 `<image href="/abs/path.png">`），宿主自动重写为可加载形式；不要手写 `data:` base64 或自定义协议
- **CDN 白名单（CSP 强制）**：`cdnjs.cloudflare.com`、`esm.sh`、`cdn.jsdelivr.net`、`unpkg.com`

### 1.4 复杂度预算（硬限制）

- 方框副标题：≤ 5 个词
- 每张图：≤ 2 组色系（ramp）
- 满宽横向层：≤ 4 个方框（每个约 140px）

### 1.5 无障碍

- HTML widget：开头放视觉隐藏的 `<h2 class="sr-only">`，内容为一句话摘要
- SVG widget：`role="img"`，首个子元素为 `<title>` 和 `<desc>`

### 1.6 CSS 变量

| 类别 | 变量 |
|---|---|
| 背景 | `--color-background-primary`（白）、`-secondary`（表面）、`-tertiary`（页面底）、`-info`、`-danger`、`-success`、`-warning` |
| 文字 | `--color-text-primary`（黑）、`-secondary`（弱化）、`-tertiary`（提示）、`-info`、`-danger`、`-success`、`-warning` |
| 边框 | `--color-border-tertiary`（0.15α，默认）、`-secondary`（0.3α，hover）、`-primary`（0.4α），以及语义色 |
| 字体 | `--font-sans`、`--font-serif`、`--font-mono` |
| 布局 | `--border-radius-md`（8px）、`-lg`（12px，多数组件首选）、`-xl`（16px） |

### 1.7 色板（9 组 × 7 级）

级别含义：50=最浅填充，100-200=浅填充，400=中间调，600=强调/描边，800-900=浅底上的文字色。

| Class | 50 | 100 | 200 | 400 | 600 | 800 | 900 |
|---|---|---|---|---|---|---|---|
| c-purple | #EEEDFE | #CECBF6 | #AFA9EC | #7F77DD | #534AB7 | #3C3489 | #26215C |
| c-teal | #E1F5EE | #9FE1CB | #5DCAA5 | #1D9E75 | #0F6E56 | #085041 | #04342C |
| c-coral | #FAECE7 | #F5C4B3 | #F0997B | #D85A30 | #993C1D | #712B13 | #4A1B0C |
| c-pink | #FBEAF0 | #F4C0D1 | #ED93B1 | #D4537E | #993556 | #72243E | #4B1528 |
| c-gray | #F1EFE8 | #D3D1C7 | #B4B2A9 | #888780 | #5F5E5A | #444441 | #2C2C2A |
| c-blue | #E6F1FB | #B5D4F4 | #85B7EB | #378ADD | #185FA5 | #0C447C | #042C53 |
| c-green | #EAF3DE | #C0DD97 | #97C459 | #639922 | #3B6D11 | #27500A | #173404 |
| c-amber | #FAEEDA | #FAC775 | #EF9F27 | #BA7517 | #854F0B | #633806 | #412402 |
| c-red | #FCEBEB | #F7C1C1 | #F09595 | #E24B4A | #A32D2D | #791F1F | #501313 |

**明暗模式速查：**

- 浅色模式：50 填充 + 600 描边 + **800 标题 / 600 副标题**
- 深色模式：800 填充 + 200 描边 + **100 标题 / 200 副标题**

### 1.8 SVG 通用规则

- viewBox 固定 `"0 0 680 H"`，**680 不可改**，是所有坐标计算基准；根 `<svg>` 上 `width="100%"`
- H = 最底部元素 + 20px，不要拍脑袋猜
- 安全区：x 从 40 到 640，y 从 40 到 (H-40)；背景透明
- 一次调用一个 SVG
- 禁止旋转文字
- 图边框线用 0.5px 描边
- 所有用于连线的 `<path>` / `<polyline>` 必须 `fill="none"`

### 1.9 预置 class

| Class | 说明 |
|---|---|
| `class="t"` | sans 14px 主色 |
| `class="ts"` | sans 12px 次要色 |
| `class="th"` | sans 14px medium（500） |
| `class="box"` | 中性矩形（bg-secondary 填充 + 边框） |
| `class="node"` | 可点击组，带 hover 效果 |
| `class="arr"` | 箭头线（1.5px，开口 V 形箭头） |
| `class="leader"` | 虚线引出线（tertiary 描边，0.5px） |
| `class="c-{ramp}"` | 彩色节点，用于 `<g>` 或 rect/circle/ellipse（**不用于 path**） |

### 1.10 箭头 marker（每个 SVG 的 `<defs>` 都必须包含）

```svg
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
      stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </marker>
</defs>
```

### 1.11 字号校准表

| 文本类型 | 字符数 | 字重 | 字号 | 渲染宽度 |
|---|---|---|---|---|
| 标题 | 12 | 500 | 14px | ~88px |
| 副标题 | 16 | 400 | 13px | ~104px |
| 正文 | 24 | 400 | 13px | ~156px |
| 说明 | 20 | 400 | 12px | ~120px |

方框宽度公式：`rect_width = max(标题字符数 × 7, 副标题字符数 × 6) + 24`

---

## 2. `diagram` — 图示

### 2.1 流程图（Flowchart）

适用：顺序流程、因果链、决策树。

- **间距**：方框之间至少 60px，框内 padding 24px，文字与边缘 12px
- **布局**：优先单向流动；一张图最多 4-5 个节点
- **循环不画成环**。改用 HTML stepper。只有在"一个输入一个输出"时才退化为带弯回箭头的线性 SVG
- 同类内容保持相同高度（单行 44px，两行 56px）
- 框内每个 `<text>` 都要 `dominant-baseline="central"`

单行节点（44px）：

```svg
<g class="node c-blue" onclick="sendPrompt('...')">
  <rect x="100" y="20" width="180" height="44" rx="8" stroke-width="0.5"/>
  <text class="th" x="190" y="42" text-anchor="middle" dominant-baseline="central">T-cells</text>
</g>
```

两行节点（56px）：

```svg
<g class="node c-blue" onclick="sendPrompt('...')">
  <rect x="100" y="20" width="200" height="56" rx="8" stroke-width="0.5"/>
  <text class="th" x="200" y="38" text-anchor="middle" dominant-baseline="central">Dendritic cells</text>
  <text class="ts" x="200" y="56" text-anchor="middle" dominant-baseline="central">Detect foreign antigens</text>
</g>
```

### 2.2 结构图（Structural）

适用：物理或逻辑包含关系（东西套着东西）。

- 最外层容器：大圆角矩形，rx=20-24，最浅填充（50 档），0.5px 描边
- 内部区域：中号圆角矩形，rx=8-12，下一个色阶（100-200 档）
- 每层容器内部至少 20px padding；最多 2-3 层嵌套
- **数据库 schema / ERD 用 mermaid.js 的 `erDiagram`，不用 SVG**

### 2.3 示意画（Illustrative）

适用：建立直觉——物理剖面或抽象空间隐喻。

- **物理对象**：画简化版（剖面图、切开图）。热水器 = 一个罐子底下加个炉头
- **抽象对象**：自造空间隐喻。Transformer = 一叠水平板层；哈希函数 = 漏斗把东西撒进桶里
- **颜色编码强度，而非类别**。暖色 = 热/能量/活跃，冷色 = 冷/静/休眠
- **优先做交互式**。真实系统有控制旋钮，图里就该有
- 允许一个 `<linearGradient>`（仅限表达连续物理属性）
- 允许 CSS `@keyframes`（仅 `transform` 和 `opacity`，循环 2s 内），包在 `@media (prefers-reduced-motion: no-preference)` 里
- 标签放在图形**外部**，用细引出线连接

### 2.4 类型路由表

| 用户说 | 类型 | 画什么 |
|---|---|---|
| "how do LLMs work" | Illustrative | token 行、堆叠板层、注意力连线 |
| "transformer architecture" | Structural | 带标签方框：embedding、注意力头、FFN、layer norm |
| "what are the training steps" | Flowchart | 前向 → 损失 → 反向 → 更新 |
| "TCP handshake sequence" | Flowchart | SYN → SYN-ACK → ACK |
| "how does TCP work" | Illustrative | 两个端点、编号数据包在途、返回的 ACK |
| "explain the Krebs cycle / event loop" | HTML stepper | 点击逐阶段。绝不画成环 |
| "draw the database schema" | mermaid.js | `erDiagram` 语法。不是 SVG |

---

## 3. `mockup` — UI 原型 / 组件

### 3.1 美学

扁平、干净、白色表面。极细 0.5px 边框。留白充足。无渐变、无阴影（功能性 focus ring 除外）。观感要与宿主 UI 原生一致。

### 3.2 设计令牌

- 边框：一律 `0.5px solid var(--color-border-tertiary)`（需要强调时用 `-secondary`）
- 圆角：`--border-radius-md` 用于多数元素，`-lg` 用于卡片
- 卡片：白底（`--color-background-primary`），0.5px 边框，radius-lg，padding `1rem 1.25rem`
- 表单元素（input、select、textarea、button、range slider）已预置样式，写裸标签即可
- 按钮：预置样式，透明底 + 0.5px border-secondary。若触发 `sendPrompt`，末尾加 ↗ 箭头
- **所有展示的数字都要取整**：用 `Math.round()`、`.toFixed(n)` 或 `Intl.NumberFormat`
- 间距：垂直节奏用 rem（1rem / 1.5rem / 2rem），组件内部间隙用 px（8 / 12 / 16）

### 3.3 指标卡（Metric cards）

`background: var(--color-background-secondary)`，无边框，`border-radius: var(--border-radius-md)`，padding `1rem`。上方 13px 弱化标签，下方 24px/500 数字。以 2-4 列网格排布，`gap: 12px`。

### 3.4 布局

- **编辑式**（说明性内容）：不加卡片外壳，文字自然流动
- **卡片式**（有边界的对象，如联系人记录、小票）：整块包在一张抬升卡片里
- **不要在这里放表格** —— 表格用 markdown 输出在回复正文里
- 网格：用 `minmax(0, 1fr)` 防止溢出
- 受限布局（≤700px）里的表格：用 `table-layout: fixed`

### 3.5 原型呈现

**有界原型**（手机屏、聊天串、弹窗）应放在背景表面之上。**满宽原型**（仪表盘、设置页）不需要额外外壳。

### 3.6 Pattern 1：交互式讲解器

用 HTML 承载交互控件——滑块、按钮、实时状态、图表。不加卡片外壳，留白即容器。用 `sendPrompt()` 让用户追问。

### 3.7 Pattern 2：选项对比

用 `repeat(auto-fit, minmax(160px, 1fr))`。主推卡片：`border: 2px solid var(--color-border-info)`（**唯一允许 2px 边框的场景**）。徽章：`background: var(--color-background-info); color: var(--color-text-info); font-size: 12px`。

### 3.8 Pattern 3：数据记录

整块包进一张抬升卡片。头像/首字母圆形：44px，`background: var(--color-background-info)`，`color: var(--color-text-info)`，`font-weight: 500`。

```html
<div style="background: var(--color-background-primary); border-radius: var(--border-radius-lg); border: 0.5px solid var(--color-border-tertiary); padding: 1rem 1.25rem;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
    <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--color-background-info); display: flex; align-items: center; justify-content: center; font-weight: 500; font-size: 14px; color: var(--color-text-info);">MR</div>
    <div>
      <p style="font-weight: 500; font-size: 15px; margin: 0;">Maya Rodriguez</p>
      <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">VP of Engineering</p>
    </div>
  </div>
</div>
```

---

## 4. `interactive` — 交互控件

- 用 HTML 承载交互控件——滑块、按钮、实时状态显示、图表
- 解释性文字留在正常回复里，**不要嵌进 HTML**
- 筛选、排序、开关、计算都在 JS 里做。只在"下一步确实需要模型思考"时才调 `sendPrompt()`
- **Stepper**：流式输出期间所有内容纵向堆叠展示；流式结束后再交给 JS 驱动分步
- **循环**：用 HTML stepper 配 `● ○ ○` 位置指示器，最后一步的"下一步"回到第一步

---

## 5. `chart` — 图表与地图

### 5.1 Chart.js 基础用法

```html
<div style="position: relative; width: 100%; height: 300px;">
  <canvas id="myChart" role="img" aria-label="Bar chart of quarterly revenue">Fallback text.</canvas>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<script>
  new Chart(document.getElementById('myChart'), {
    type: 'bar',
    data: { labels: ['Q1','Q2','Q3','Q4'], datasets: [{ label: 'Revenue', data: [12,19,8,15] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });
</script>
```

### 5.2 图表规则

- 每个 `<canvas>` **必须**有 `role="img"`、描述性 `aria-label`，以及标签之间的 fallback 文本
- 不能只靠颜色区分数据系列 —— 每种颜色要配一个次要视觉线索
- Canvas 无法解析 CSS 变量 → 用硬编码 hex
- 高度**只**设在外层 div 上，绝不在 canvas 元素上设
- 水平条形图：外层 div 高度至少 `(条形数 × 40) + 80` px
- 通过 `cdnjs.cloudflare.com` 加载 UMD 构建，后面跟普通 `<script>`（**不要** `type="module"`）
- 多个图表：用唯一 ID（`myChart1`、`myChart2`）
- 气泡图/散点图：坐标轴范围在数据范围外多留约 10%，避免裁切
- 类目 ≤ 12 个时：设 `scales.x.ticks: { autoSkip: false, maxRotation: 45 }`
- 负值写法：`-$5M`，不是 `$-5M`

### 5.3 图例

一律禁用默认图例，改用自定义 HTML：

```js
plugins: { legend: { display: false } }
```

```html
<div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 8px; font-size: 12px; color: var(--color-text-secondary);">
  <span style="display: flex; align-items: center; gap: 4px;">
    <span style="width: 10px; height: 10px; border-radius: 2px; background: #3266ad;"></span>Chrome 65%
  </span>
</div>
```

### 5.4 地理地图（D3 choropleth）

**绝不臆造坐标** —— 不要手绘 SVG path，不要内联 GeoJSON。要么拉真实拓扑数据，要么别画地图。

| 覆盖范围 | URL | 投影 | 对象 key |
|---|---|---|---|
| 美国各州 | `https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json` | `d3.geoAlbersUsa()` | `.states` |
| 世界各国 | `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` | `d3.geoNaturalEarth1()` | `.countries` |
| 单国次级区划 | `https://cdn.jsdelivr.net/npm/datamaps@0.5.10/src/js/data/{iso3}.topo.json` | 视情况 | `.{iso3}` |

先 fetch 拓扑 URL，检查真实的 `id` 和 `properties.name` 字段，再构建组件。CSP 会拦截 `raw.githubusercontent.com` 等未列出的域名。

```html
<div id="map" style="width: 100%;"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js"></script>
<script>
const values = { 'California': 39, 'Texas': 30, 'New York': 19 };
const isDark = matchMedia('(prefers-color-scheme: dark)').matches;
const color = d3.scaleQuantize([0, 40], isDark ? d3.schemeBlues[5].slice().reverse() : d3.schemeBlues[5]);
const svg = d3.select('#map').append('svg').attr('viewBox', '0 0 900 560').attr('width', '100%');
const path = d3.geoPath(d3.geoAlbersUsa().scale(1100).translate([450, 280]));
d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json').then(us => {
  svg.selectAll('path').data(topojson.feature(us, us.objects.states).features).join('path')
    .attr('d', path)
    .attr('stroke', isDark ? 'rgba(255,255,255,.15)' : '#fff')
    .attr('fill', d => color(values[d.properties.name] ?? 0));
});
</script>
```

> 合规提醒：涉及中国地图须使用含完整国界线与南海诸岛的官方标准底图，并遵守国家测绘地理信息法规。

---

## 6. `art` — 插画（规则豁免区）

用 SVG。技术规范（viewBox、安全区）与其他模块相同，但**美学取向不同，且豁免部分通用限制**：

- **填满画布** —— 插画要饱满，不要稀疏
- **用色大胆**：混用 `--color-text-*` 各类别（info 蓝、success 绿、warning 琥珀）制造变化
- **插画是唯一允许自定义 `<style>` 颜色块的地方** —— 可自由配色，也可为深色模式写 `prefers-color-scheme` 变体
- 用不透明形状叠加制造层次感
- 用 `<path>` 曲线、`<ellipse>`、`<circle>` 做有机形态
- 纹理靠**重复**（平行线、圆点、排线），不用栅格特效
- 几何图案用 `<g transform="rotate()">` 做径向对称

**与公共底座的冲突点（以本模块为准）：**

| 通用规则 | art 模块 |
|---|---|
| 每图 ≤ 2 组色系 | 鼓励混用多类别色 |
| 避免自定义 `<style>` 颜色块 | 明确允许 |
| 扁平、克制 | 饱满、层次、激进 |

---

## 7. 实战速查

| 我想做… | 传什么 |
|---|---|
| 概念层级、系统结构 | `diagram` |
| 流程、时序、步骤链 | `diagram` |
| 物理剖面、直觉隐喻 | `diagram` |
| 设置页 / 仪表盘 / 表单原型 | `mockup` |
| 联系人卡片、小票、对比卡 | `mockup` |
| 滑块、开关、分步引导 | `interactive` |
| 柱状 / 折线 / 饼图 | `chart` |
| 地图 / 热力分布 | `chart` |
| 装饰性插画、头图 | `art` |

**主题适配**：宿主每轮注入 `IDE Theme: light|dark`，据此选用 1.7 节的明暗速查配色，不要硬编码与主题相悖的色值。
