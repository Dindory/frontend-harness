#!/usr/bin/env bash
# 프로젝트 루트에서 실행: bash .my-harness/scripts/new-task.sh <slug> ["제목"]
#   .my-harness/tasks/YYYY-MM-DD-<slug>.md 를 요청서 양식으로 만든다.
set -euo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLUG="${1:-}"
[ -n "$SLUG" ] || { sed -n '2,3p' "$0"; exit 2; }
TITLE="${2:-$SLUG}"
DATE="$(date +%Y-%m-%d)"
FILE="$HARNESS_DIR/tasks/$DATE-$SLUG.md"

mkdir -p "$HARNESS_DIR/tasks"
[ ! -e "$FILE" ] || { echo "이미 있습니다: $FILE" >&2; exit 1; }
CONTENT="$(cat "$HARNESS_DIR/templates/task.md")"
CONTENT="${CONTENT//\{\{TITLE\}\}/$TITLE}"
CONTENT="${CONTENT//\{\{DATE\}\}/$DATE}"
printf '%s\n' "$CONTENT" > "$FILE"
echo "${FILE#"$PWD"/}"
