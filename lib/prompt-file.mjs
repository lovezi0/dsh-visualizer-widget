// 提示词文件：<profileContext.dir>/.visualizer-widget/prompt.md
// 参考 dsh-memory-palace 的私有目录约定（<profileDir>/.memory-palace/...）：
// 插件私有落盘放 profile 目录，不进用户项目、不进插件 config。
// 目录 0700 / 文件 0600（Windows 忽略 mode），已存在绝不覆盖。
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const PROMPT_DIR_NAME = ".visualizer-widget";
export const PROMPT_FILE_NAME = "prompt.md";
export const PROMPT_MAX_CHARS = 100000;

export function promptFilePath(profileDir) {
  return join(profileDir, PROMPT_DIR_NAME, PROMPT_FILE_NAME);
}

export function ensurePromptFile(profileDir, fallbackText) {
  const dir = join(profileDir, PROMPT_DIR_NAME);
  const file = join(dir, PROMPT_FILE_NAME);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    writeFileSync(file, fallbackText, { encoding: "utf8", flag: "wx", mode: 0o600 });
  } catch (error) {
    if (!error || error.code !== "EEXIST") throw error;
  }
  return { file, content: readPromptFile(file, fallbackText) };
}

// 设置页保存：临时文件 + rename 原子替换；Windows 上 rename 偶发失败时回退为覆盖。
export function writePromptFile(profileDir, text) {
  const dir = join(profileDir, PROMPT_DIR_NAME);
  const file = join(dir, PROMPT_FILE_NAME);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const tmp = file + ".tmp-" + process.pid + "-" + Date.now();
  writeFileSync(tmp, text, { encoding: "utf8", mode: 0o600 });
  try {
    renameSync(tmp, file);
  } catch (error) {
    writeFileSync(file, text, { encoding: "utf8", mode: 0o600 });
    try { unlinkSync(tmp); } catch (cleanupError) { /* 临时文件清理失败可忽略 */ }
  }
  return file;
}

// systemPrompt.section.text() 必须是同步函数；每轮读盘以支持直接编辑。
// 空文件或读取失败都回落到 fallback（上一份有效内容/内置默认），不抛错。
export function readPromptFile(file, fallbackText) {
  try {
    const text = readFileSync(file, "utf8").trim();
    return text.length > 0 ? text : fallbackText;
  } catch (error) {
    return fallbackText;
  }
}
