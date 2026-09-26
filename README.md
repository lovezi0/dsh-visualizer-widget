# dsh-visualizer-widget

DeepSeek Harness 的会话流「内联可视化」插件：模型产出 SVG / HTML 源码后，交给浏览器渲染成一张可交互的内联卡片，源码只进卡片、不回灌模型上下文。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE) [![npm](https://img.shields.io/npm/v/dsh-visualizer-widget.svg?label=npm&labelColor=000000&color=ff4b01)](https://www.npmjs.com/package/dsh-visualizer-widget) [![DeepSeek Harness:0.1.7-rc.2](https://img.shields.io/badge/DeepSeek%20Harness-0.1.7--rc.2-success.svg?labelColor=4D6BFE)](https://github.com/deepseek-ai/deepseek-harness) [![Desktop: supported](https://img.shields.io/badge/Desktop-supported-success.svg?labelColor=4D6BFE)](#安装)

## 能做什么

插件注册两个工具，并提供一条会话命令：

| 工具 | 作用 |
| --- | --- |
| `render_visual` | 把 SVG / HTML 源码渲染成会话流内联卡片（预览/源码切换、高度档位、浅色/深色底、弹出全屏查看、重跑、下载、保存为图片、复制） |
| `get_visualizer_spec` | 按需返回统一渲染规范全文（viewBox 基准 680、字号/字重约束、9×7 色板、明暗配色、图类型路由、导出陷阱等） |

完整卡片作为消息流一等行渲染（自定义 Chat Node，锚定在工具调用行之后），源码经 iframe `srcdoc` 沙箱隔离渲染；工具调用块本身只留一行紧凑状态提示，规避宿主对工具块的高度限制。

## 效果预览

![dsh-visualizer-widget 会话流内联可视化卡片效果](assets/image.png)

## 设计要点

- **源码与模型上下文解耦**：`render_visual` 的 `output.render` 只回一行摘要（格式 / 字符数 / 高度），完整源码只留在工具结果与卡片里，不进入模型上下文。
- **渲染规范随包分发**：`get_visualizer_spec` 返回的规范固化的内联可视化设计规范，生成源码时据此保持统一视觉。
- **安全隔离**：iframe 沙箱只给 `allow-scripts allow-popups allow-forms`，不带 `allow-same-origin`，卡片内脚本拿不到主页面 DOM / storage。
- **提示词注入默认关闭**：把「优先用 render_visual 内联渲染」写进系统提示词是可选增强，默认不开启；需要时在插件设置里打开（此后每轮都引导模型），或用 `/visual` 命令按次触发。

## 安装

### Web / CLI

```bash
# GitHub
dsh plugin --profile web add github:lovezi0/dsh-visualizer-widget

# npm
dsh plugin --profile web add dsh-visualizer-widget
```
```bash
# 卸载
dsh plugin --profile web remove dsh-visualizer-widget
```

### 桌面版（DSH Desktop）

- 推荐直接填包名 `dsh-visualizer-widget`（走 npm registry，装完重启应用即可）。
- 也可填 `github:lovezi0/dsh-visualizer-widget`。
## 构建

```bash
npm run build
```

产物 `lib/index.js`（host 半）与 `lib/client.js`（client 半单文件 bundle）已随包提交，`github:` 安装拉到的源码自带 `lib/`，加载即用。

## 使用

> **默认行为**：本插件默认**不往系统提示词注入任何内容**。不开启注入时，模型仍会在你说「画一个柱状图看板」「渲染这段 SVG 原型」时按工具描述自行调用 `render_visual`；生成复杂图表前可先调 `get_visualizer_spec` 核对规范。

### 按次触发：`/visual <需求描述>`

在输入框敲 `/visual` 加一句需求（例：`/visual 画一个三栏架构图`），需求会作为一条用户消息**立即交给模型**，并要求它用 `render_visual` 内联渲染。这条命令不依赖注入开关，适合「只想这一次渲染」的场景；Web / 桌面版的斜杠菜单里可直接发现它（留空参数会返回用法提示，不产生消息）。

### 每轮都优先渲染：开启提示词注入

想让模型每一轮都优先使用内联卡片（而不是输出 SVG/HTML 代码或写文件），到插件设置页（设置 → 插件 → dsh-visualizer-widget）打开「启用提示词注入」；关掉即回到默认。

## 版本历史

- **0.3.0**
    - 🔥增加会话命令手动触发Agent使用viz插件
    - 💥内置提示词注入默认不启用
    - 💥移除可视化card 弹出dialog 拖拽平移功能
    - 🐛修复内置提示词保存失败的问题
- **0.2.0**
    - 徽标核验线更新至 0.1.7-rc.1
    - npm publish
    - **0.2.0-alpha.1**
        - 💪适配deepseek harness 0.1.7-alpha.1
        - 🐛修复某些情况下浅色的色块渲染成纯黑
        - 💪visual card 现在将在回复块中显示
        - 💪visual card 现在支持弹出预览
- **0.1.0**
    - 🔥会话流「内联可视化」插件
