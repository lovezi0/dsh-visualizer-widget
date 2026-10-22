// 设置页同源 route：/dsh-visualizer-widget/api
// 只读写 profile 目录下的 .visualizer-widget/prompt.md；数据唯一来源仍是该文件。
// 信任栅栏与 dsh-better-sidebar / dsh-memory-palace 同款：只接受 loopback 或
// webStartup.trustedHosts 声明的权威，拒绝 cross-site 与 origin 不匹配的请求。
import { ensurePromptFile, writePromptFile, PROMPT_MAX_CHARS } from "./prompt-file.mjs";

export const API_PREFIX = "/dsh-visualizer-widget/api";
const MAX_BODY_BYTES = 1 << 20;

function headerOf(headers, name) {
  const value = headers[name];
  return typeof value === "string" ? value : undefined;
}

function parseAuthority(authority) {
  try {
    return new URL("http://" + authority);
  } catch (error) {
    return undefined;
  }
}

function isLoopbackHostname(hostname) {
  if (hostname === "localhost" || hostname === "[::1]") return true;
  const parts = hostname.split(".");
  return (
    parts.length === 4 &&
    parts[0] === "127" &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  );
}

function canonicalAuthority(entry, entryUrl) {
  const port = entryUrl.port !== "" ? entryUrl.port : new URL("https://" + entry).port;
  return port === "" ? entryUrl.hostname : entryUrl.hostname + ":" + port;
}

function isTrustedAuthority(hostUrl, trustedHosts) {
  return (trustedHosts || []).some((entry) => {
    const entryUrl = parseAuthority(entry);
    if (entryUrl === undefined) return false;
    return canonicalAuthority(entry, entryUrl) === entryUrl.hostname
      ? entryUrl.hostname === hostUrl.hostname
      : entryUrl.host === hostUrl.host;
  });
}

function isTrustedRequest(request, trustedHosts) {
  const host = headerOf(request.headers, "host");
  if (host === undefined) return false;
  const hostUrl = parseAuthority(host);
  if (hostUrl === undefined) return false;
  if (!isLoopbackHostname(hostUrl.hostname) && !isTrustedAuthority(hostUrl, trustedHosts)) return false;
  if (headerOf(request.headers, "sec-fetch-site") === "cross-site") return false;
  const origin = headerOf(request.headers, "origin");
  if (origin === undefined) return true;
  try {
    return new URL(origin).host === hostUrl.host;
  } catch (error) {
    return false;
  }
}

function httpError(code, message, status) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function badRequest(message) {
  return httpError("bad-request", message, 400);
}

function unavailable(message) {
  return httpError("profile-unavailable", message, 503);
}

function errorText(error) {
  return error && error.message ? error.message : String(error);
}

async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) throw badRequest("请求体过大");
    chunks.push(buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (text.trim() === "") return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    throw badRequest("请求体不是合法 JSON");
  }
}

function writeJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(payload);
}

function profileDirOf(ctx) {
  const profile = ctx.get("profileContext");
  return profile && typeof profile.dir === "string" && profile.dir.length > 0 ? profile.dir : undefined;
}

async function handle(ctx, defaultPrompt, req, res) {
  const startup = ctx.get("webStartup");
  const trustedHosts = startup && Array.isArray(startup.trustedHosts) ? startup.trustedHosts : [];
  if (!isTrustedRequest(req, trustedHosts)) {
    writeJson(res, 403, { ok: false, error: { code: "forbidden", message: "forbidden" } });
    return;
  }
  if (req.method !== "POST") {
    writeJson(res, 405, { ok: false, error: { code: "method-error", message: "method not allowed" } });
    return;
  }

  const pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
  if (!pathname.startsWith(API_PREFIX + "/")) {
    writeJson(res, 404, { ok: false, error: { code: "not-found", message: "unknown prompt API" } });
    return;
  }
  const method = pathname.slice(API_PREFIX.length + 1);
  if (method === "" || method.includes("/")) {
    writeJson(res, 404, { ok: false, error: { code: "not-found", message: "unknown prompt API method" } });
    return;
  }

  try {
    const payload = await readJson(req);
    const dir = profileDirOf(ctx);
    if (!dir) throw unavailable("当前宿主没有 profileContext，无法定位 .visualizer-widget/prompt.md");

    if (method === "prompt.get") {
      const result = ensurePromptFile(dir, defaultPrompt);
      writeJson(res, 200, { ok: true, value: { prompt: result.content, file: result.file } });
      return;
    }

    if (method === "prompt.update") {
      if (typeof payload.prompt !== "string") throw badRequest("prompt 必须是字符串");
      const text = payload.prompt.trim();
      if (text.length === 0) throw badRequest("prompt 不能为空");
      if (text.length > PROMPT_MAX_CHARS) throw badRequest("prompt 过长（上限 " + PROMPT_MAX_CHARS + " 字符）");
      const file = writePromptFile(dir, text);
      writeJson(res, 200, { ok: true, value: { prompt: text, file } });
      return;
    }

    writeJson(res, 404, { ok: false, error: { code: "not-found", message: "unknown prompt API method" } });
  } catch (error) {
    const status = typeof error.status === "number" ? error.status : 500;
    writeJson(res, status, {
      ok: false,
      error: { code: error.code || "internal", message: errorText(error) },
    });
  }
}

export function registerPromptApi(ctx, defaultPrompt) {
  return ctx.webServer.register({
    kind: "prefix",
    path: API_PREFIX,
    handler: (req, res) => {
      void handle(ctx, defaultPrompt, req, res);
    },
  });
}
