#!/usr/bin/env bash
# 프로젝트 루트에서 실행: bash .my-harness/scripts/check-links.sh [경로...]
#   git 이 추적하는 Markdown 파일의 상대 링크가 실제 파일을 가리키는지 확인한다. (기본: 전체)
set -uo pipefail

cd "$(git rev-parse --show-toplevel)"
git ls-files -z -- '*.md' "$@" | node -e '
const fs = require("fs"), path = require("path");
const files = fs.readFileSync(0, "utf8").split("\0").filter(Boolean);
let broken = 0;
for (const f of files) {
  const text = fs.readFileSync(f, "utf8").replace(/```[\s\S]*?```/g, "");
  for (const m of text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = m[1].split("#")[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    const resolved = path.normalize(path.join(path.dirname(f), decodeURI(target)));
    if (!fs.existsSync(resolved)) { console.log(`❌ ${f} → ${m[1]}`); broken++; }
  }
}
console.log(broken ? `\n깨진 링크 ${broken}개` : `✅ ${files.length}개 문서의 링크 정상`);
process.exit(broken ? 1 : 0);
'
