#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const CSS_ALLOWLIST = new Set(["src/app/globals.css"]);
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mdx"]);
const IGNORED_DIRS = new Set([".git", ".next", "node_modules", "dist", "build", ".tmp"]);

async function walk(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function toProjectPath(fullPath) {
  return path.relative(ROOT, fullPath).split(path.sep).join("/");
}

function getLine(content, index) {
  return content.slice(0, index).split("\n").length;
}

function parsePaddingPixels(rawValue) {
  if (rawValue === "px") return 1;

  if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) {
    return Number(rawValue) * 4;
  }

  const arbitrary = rawValue.match(/^\[(.+)\]$/);
  if (!arbitrary) return null;

  const value = arbitrary[1]?.trim();
  if (!value) return null;

  const pxMatch = value.match(/^(-?\d+(?:\.\d+)?)px$/i);
  if (!pxMatch) {
    return Number.NaN;
  }

  return Number(pxMatch[1]);
}

async function main() {
  const allFiles = await walk(SRC_DIR);
  const violations = [];

  for (const fullPath of allFiles) {
    const projectPath = toProjectPath(fullPath);
    const extension = path.extname(fullPath);

    if (extension === ".css" && !CSS_ALLOWLIST.has(projectPath)) {
      violations.push(`${projectPath}: 禁止新增 CSS 文件（允许列表之外）`);
    }

    if (!CODE_EXTENSIONS.has(extension)) continue;

    const content = await fs.readFile(fullPath, "utf8");

    const isClientCode = projectPath.startsWith("src/app/") || projectPath.startsWith("src/components/");
    const isApiRoute = projectPath.includes("/api/");
    const isTestFile = projectPath.includes(".test.") || projectPath.includes(".spec.");

    if (isClientCode && !isApiRoute && !isTestFile && /\bresponse\.json\(/.test(content)) {
      violations.push(`${projectPath}: 客户端禁止直接调用 response.json()，请使用 Zod 合同 + src/lib/api/client.ts`);
    }

    const tokenPattern = /(?:^|[\s"'`])((?:[a-z0-9_-]+:)*p(?:x|y|t|r|b|l)?-(?:\[[^\]\s"'`]+\]|[^\s"'`{}]+))/gi;
    for (const match of content.matchAll(tokenPattern)) {
      const token = match[1];
      if (!token) continue;

      const baseClass = token.split(":").at(-1);
      if (!baseClass) continue;

      const classMatch = baseClass.match(/^p(?:x|y|t|r|b|l)?-(.+)$/);
      if (!classMatch) continue;

      const rawValue = classMatch[1];
      const pxValue = parsePaddingPixels(rawValue);

      if (pxValue === null) continue;

      const line = getLine(content, match.index ?? 0);

      if (Number.isNaN(pxValue)) {
        violations.push(
          `${projectPath}:${line}: \`${token}\` 使用了无法校验的 padding 值，需使用 Tailwind spacing token 或 [Npx]。`,
        );
        continue;
      }

      if (Math.abs(pxValue % 2) > Number.EPSILON) {
        violations.push(`${projectPath}:${line}: \`${token}\` 对应 ${pxValue}px，不是 2px 的倍数。`);
      }
    }
  }

  if (violations.length > 0) {
    console.error("\nStandards check failed:\n");
    for (const issue of violations) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log("Standards check passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
