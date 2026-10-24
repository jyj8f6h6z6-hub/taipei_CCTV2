#!/usr/bin/env node
/*
 * 一行指令同步更新版號：
 *   node scripts/bump-version.js 2.4.0
 *
 * 會修改：
 *   - script.js 的 APP_VERSION、APP_UPDATED（日期用台北時間的今天）
 *   - index.html 裡 style.css、script.js 的 ?v=
 * CHANGELOG.md 要自己寫，這支只會提醒你有沒有寫。
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const version = process.argv[2];

if (!/^\d+\.\d+\.\d+$/.test(version || "")) {
  console.error("用法：node scripts/bump-version.js 2.4.0");
  process.exit(1);
}

const today = new Date().toLocaleDateString("sv-SE", {
  timeZone: "Asia/Taipei"
});

function edit(file, change) {
  const fullPath = path.join(root, file);
  const before = fs.readFileSync(fullPath, "utf8");
  const after = change(before);

  if (after === before) {
    console.warn(`⚠ ${file} 沒有變動（版號可能已經是 ${version}）`);
    return;
  }

  fs.writeFileSync(fullPath, after, "utf8");
  console.log(`✔ 已更新 ${file}`);
}

function replaceOnce(text, pattern, replacement, label) {
  if (!pattern.test(text)) {
    throw new Error(`找不到 ${label}，請檢查檔案格式`);
  }

  return text.replace(pattern, replacement);
}

edit("script.js", text => {
  text = replaceOnce(
    text,
    /const APP_VERSION = "[^"]*";/,
    `const APP_VERSION = "${version}";`,
    "APP_VERSION"
  );

  return replaceOnce(
    text,
    /const APP_UPDATED = "[^"]*";/,
    `const APP_UPDATED = "${today}";`,
    "APP_UPDATED"
  );
});

edit("index.html", text =>
  replaceOnce(
    text,
    /(style\.css|script\.js)\?v=[\d.]+/g,
    `$1?v=${version}`,
    "?v= 版號"
  )
);

const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");

if (!changelog.includes(`## v${version}`)) {
  console.warn(`⚠ CHANGELOG.md 還沒有「## v${version}」，記得補上這次改了什麼`);
}

console.log(`版號：v${version}（${today}）`);
