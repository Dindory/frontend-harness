#!/usr/bin/env bash
# 프로젝트 루트에서 실행: bash .my-harness/scripts/create-pr.sh --body-file <file> [options]
#   --body-file <f> PR 본문 (.my-harness/templates/pr-body.md 양식으로 작성)
#   --title <t>     PR 제목 (기본: 마지막 커밋 제목)
#   --base <b>      대상 브랜치 (기본: 레포 기본 브랜치)
#   --ready         Draft 가 아닌 일반 PR 로 생성
#   --skip-tests    검증 생략 (본문에 생략 사실이 추가됨)
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TITLE=""
BASE=""
BODY_SRC=""
DRAFT="--draft"
SKIP_TESTS=0

while [ $# -gt 0 ]; do
  case "$1" in
    --body-file) BODY_SRC="${2:-}"; shift ;;
    --title) TITLE="${2:-}"; shift ;;
    --base) BASE="${2:-}"; shift ;;
    --ready) DRAFT="" ;;
    --skip-tests) SKIP_TESTS=1 ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

die() { echo "❌ $*" >&2; exit 1; }

[ -n "$BODY_SRC" ] && [ -f "$BODY_SRC" ] || die "--body-file 이 필요합니다. 양식: $HARNESS_DIR/templates/pr-body.md"
for section in "## 대상" "## 실행한 검증" "## 확인하지 못한 것"; do
  grep -qF "$section" "$BODY_SRC" || die "PR 본문에 '$section' 섹션이 없습니다."
done

command -v gh >/dev/null || die "gh CLI 가 필요합니다: brew install gh && gh auth login"
gh auth status >/dev/null 2>&1 || die "gh 로그인이 필요합니다: gh auth login"

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ -n "$BASE" ] || BASE="$(gh repo view --json defaultBranchRef -q .defaultBranchRef.name)"
[ "$BRANCH" != "$BASE" ] || die "기본 브랜치($BASE)에서는 PR 을 만들 수 없습니다. 작업 브랜치를 먼저 만드세요."
[ -z "$(git status --porcelain)" ] || die "커밋되지 않은 변경사항이 있습니다. 먼저 커밋하세요."

git fetch -q origin "$BASE" || true
[ -n "$(git log --no-merges --format=%h "origin/$BASE..HEAD" 2>/dev/null)" ] || die "origin/$BASE 대비 새 커밋이 없습니다."

EXISTING="$(gh pr view "$BRANCH" --json url -q .url 2>/dev/null || true)"
if [ -n "$EXISTING" ]; then
  git push -u origin HEAD
  echo "ℹ️  이미 PR 이 있습니다. 새 커밋만 push 했습니다: $EXISTING"
  exit 0
fi

BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT
cp "$BODY_SRC" "$BODY_FILE"

if [ "$SKIP_TESTS" -eq 1 ]; then
  printf '\n> ⚠️ PR 생성 시 자동 검증을 생략했습니다 (--skip-tests).\n' >> "$BODY_FILE"
else
  bash "$HARNESS_DIR/scripts/run-tests.sh" || die "검증 실패. PR 을 생성하지 않았습니다."
fi

[ -n "$TITLE" ] || TITLE="$(git log -1 --format=%s)"

git push -u origin HEAD
gh pr create --base "$BASE" --title "$TITLE" --body-file "$BODY_FILE" $DRAFT
