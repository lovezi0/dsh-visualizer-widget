// 构建脚本：把 src/ 复制为 lib/（ESM），并拼接 client 半为单文件 bundle。
// 纯复制 + 零依赖拼接，运行时 @deepseek-ai/* 由装载本包的 profile 的 node_modules 解析。
// 入口约定：src/index.mjs → lib/index.js（package.json main 指向 lib/index.js）；
//          src/client/*.js → lib/client.js（浏览器 bundle 单文件）。
// 客户端模块系统不支持插件相对 require，多文件必须零依赖拼接为一个 bundle。
import { mkdirSync, cpSync, copyFileSync, existsSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// npm run build 运行时 cwd 即为包根目录。
const root = process.cwd();
const src = join(root, "src");
const lib = join(root, "lib");
mkdirSync(lib, { recursive: true });

// 递归复制整个 src/ 到 lib/（含 references/ 渲染规范、client/ parts）。
if (existsSync(src)) cpSync(src, lib, { recursive: true });

// 服务端入口：src/index.mjs → lib/index.js（与 package.json main 对齐）。
copyFileSync(join(src, "index.mjs"), join(lib, "index.js"));
// 清理冗余：递归复制产生的 lib/index.mjs 与入口重命名后的 lib/index.js 内容重复，删除。
// 避免 safe-delete shim 导致 rmSync 报错，改用 try-catch 忽略。
try { rmSync(join(lib, "index.mjs"), { force: true }); } catch {}

// 浏览器 bundle：src/client/ 按序拼接 → lib/client.js（单自包含 bundle）。
// 顺序即闭包作用域依赖顺序：head 定义 module/exports/React，中间定义常量与组件，tail 定义 apply 并导出。
const CLIENT_PARTS = [
  "00-head.js",
  "10-card.js",
  "20-settings-card.js",
  "30-chat-node.js",
  "90-tail.js",
];
const clientDir = join(src, "client");
const clientSource = CLIENT_PARTS.map((f) => readFileSync(join(clientDir, f), "utf8")).join("\n\n");
writeFileSync(join(lib, "client.js"), clientSource);
// 移除递归复制产生的 lib/client/（parts 已拼入 lib/client.js，不随包分发）。
try { rmSync(join(lib, "client"), { recursive: true, force: true }); } catch {}

console.log("built lib/ from src/ (recursive copy + index.js entry rename + client bundle concat)");
