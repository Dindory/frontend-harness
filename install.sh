#!/usr/bin/env bash
# frontend-harness installer
#
# 로컬 실행:   bash /path/to/frontend-harness/install.sh [TARGET_DIR] [--profile NAME]
# 원격 실행:   curl -fsSL https://raw.githubusercontent.com/Dindory/frontend-harness/main/install.sh | bash
#              curl -fsSL .../install.sh | bash -s -- /path/to/target --profile NAME
#
# 환경 변수:
#   HARNESS_REPO  (기본: Dindory/frontend-harness)
#   HARNESS_REF   (기본: main)
set -euo pipefail

HARNESS_REPO="${HARNESS_REPO:-Dindory/frontend-harness}"
HARNESS_REF="${HARNESS_REF:-main}"
HARNESS_NAME=".my-harness"

TARGET_ARG="."
PROFILE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --profile) PROFILE="${2:-}"; shift ;;
    --profile=*) PROFILE="${1#--profile=}" ;;
    -*) echo "unknown option: $1" >&2; exit 2 ;;
    *) TARGET_ARG="$1" ;;
  esac
  shift
done

TARGET_DIR="$(cd "$TARGET_ARG" && pwd)"
HARNESS_DIR="$TARGET_DIR/$HARNESS_NAME"

info() { printf '%s\n' "$*"; }
warn() { printf '⚠️  %s\n' "$*" >&2; }

# 훅이 TypeScript 라서 Bun 으로 실행한다
command -v bun >/dev/null || { warn "bun 이 필요합니다: curl -fsSL https://bun.sh/install | bash"; exit 1; }

# ---------------------------------------------------------------------------
# 1. 하네스 소스 위치 결정
#    - 레포를 clone 해서 실행했다면 스크립트 옆의 .my-harness 사용
#    - curl | bash 로 실행했다면 로컬 파일이 없으므로 GitHub tarball 다운로드
# ---------------------------------------------------------------------------
SCRIPT_PATH="${BASH_SOURCE[0]:-}"
SOURCE_DIR=""
if [ -n "$SCRIPT_PATH" ] && [ -f "$SCRIPT_PATH" ]; then
  SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
  [ -d "$SCRIPT_DIR/$HARNESS_NAME" ] && SOURCE_DIR="$SCRIPT_DIR/$HARNESS_NAME"
fi

if [ -z "$SOURCE_DIR" ]; then
  TMP_DIR="$(mktemp -d)"
  trap 'rm -rf "$TMP_DIR"' EXIT
  info "⬇️  Downloading $HARNESS_REPO@$HARNESS_REF ..."
  curl -fsSL "https://codeload.github.com/$HARNESS_REPO/tar.gz/$HARNESS_REF" | tar -xz -C "$TMP_DIR"
  SOURCE_DIR="$(find "$TMP_DIR" -mindepth 2 -maxdepth 2 -type d -name "$HARNESS_NAME" | head -n 1)"
  [ -n "$SOURCE_DIR" ] || { warn "다운로드한 아카이브에서 $HARNESS_NAME 를 찾지 못했습니다."; exit 1; }
fi

if [ "$SOURCE_DIR" = "$HARNESS_DIR" ]; then
  warn "하네스 레포 자신에게는 설치할 수 없습니다. 타깃 프로젝트 경로를 인자로 주세요."
  exit 1
fi

# 1-1. 프로필 선택: --profile > origin URL 이 match.remote 를 포함 > 이전에 설치한 프로필
PROFILES_DIR="$SOURCE_DIR/profiles"
jget() { grep -o "\"$2\": *\"[^\"]*\"" "$1" 2>/dev/null | head -1 | sed 's/.*"\([^"]*\)"$/\1/' || true; }

ORIGIN="$(git -C "$TARGET_DIR" remote get-url origin 2>/dev/null || true)"
if [ -z "$PROFILE" ] && [ -n "$ORIGIN" ]; then
  for f in "$PROFILES_DIR"/*/profile.json; do
    remote="$(jget "$f" remote)"
    if [ -n "$remote" ] && [[ "$ORIGIN" == *"$remote"* ]]; then PROFILE="$(basename "$(dirname "$f")")"; break; fi
  done
fi
[ -n "$PROFILE" ] || PROFILE="$(jget "$HARNESS_DIR/profile/profile.json" name)"
if [ ! -f "$PROFILES_DIR/${PROFILE:-_}/profile.json" ]; then
  warn "프로필을 정하지 못했습니다. --profile 로 지정하세요: $(ls "$PROFILES_DIR" | tr '\n' ' ')"
  exit 1
fi

info "🚀 Installing harness into $TARGET_DIR (profile: $PROFILE)"

# ---------------------------------------------------------------------------
# 2. 하네스 본체 복사 (재실행 시 최신 버전으로 교체)
# ---------------------------------------------------------------------------
#    tasks/ (내 작업 요청서)는 사용자 데이터라 보존한다.
PRESERVE_DIR=""
if [ -d "$HARNESS_DIR/tasks" ]; then
  PRESERVE_DIR="$(mktemp -d)"
  cp -R "$HARNESS_DIR/tasks" "$PRESERVE_DIR/"
fi
rm -rf "$HARNESS_DIR"
mkdir -p "$HARNESS_DIR"
cp -R "$SOURCE_DIR/." "$HARNESS_DIR/"
rm -rf "$HARNESS_DIR/tasks" "$HARNESS_DIR/profiles"
cp -R "$PROFILES_DIR/$PROFILE" "$HARNESS_DIR/profile"
if [ -n "$PRESERVE_DIR" ]; then
  cp -R "$PRESERVE_DIR/tasks" "$HARNESS_DIR/"
  rm -rf "$PRESERVE_DIR"
fi
chmod +x "$HARNESS_DIR"/scripts/*.sh
info "✅ Copied harness → $HARNESS_NAME/"

# ---------------------------------------------------------------------------
# 3. git 에서 숨기기
#    .gitignore 는 팀 공용 파일이라 수정 자체가 diff 로 남는다.
#    대신 로컬 전용인 .git/info/exclude 를 사용한다.
# ---------------------------------------------------------------------------
EXCLUDE_FILE=""
if git -C "$TARGET_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  EXCLUDE_FILE="$(cd "$TARGET_DIR" && git rev-parse --path-format=absolute --git-path info/exclude)"
  mkdir -p "$(dirname "$EXCLUDE_FILE")"
  touch "$EXCLUDE_FILE"
  grep -qxF "# frontend-harness (personal)" "$EXCLUDE_FILE" || printf '\n# frontend-harness (personal)\n' >> "$EXCLUDE_FILE"
else
  warn "$TARGET_DIR 는 git 저장소가 아닙니다. 설치된 파일을 직접 관리하세요."
fi

exclude() {
  [ -n "$EXCLUDE_FILE" ] || return 0
  grep -qxF "$1" "$EXCLUDE_FILE" || echo "$1" >> "$EXCLUDE_FILE"
}

exclude "/$HARNESS_NAME/"

# ---------------------------------------------------------------------------
# 4. Claude Code 연결
#    이미 팀이 커밋한 파일과 이름이 겹치면 건드리지 않는다.
# ---------------------------------------------------------------------------
is_tracked() { git -C "$TARGET_DIR" ls-files --error-unmatch "$1" >/dev/null 2>&1; }

# install_entry <source> <target-relative-path>: 복사(또는 심볼릭 링크) 후 exclude 등록
install_entry() {
  local src="$1" rel="$2" mode="${3:-copy}"
  if is_tracked "$rel"; then
    warn "$rel 은 팀 저장소 파일이라 건너뜁니다."
    return 0
  fi
  rm -rf "${TARGET_DIR:?}/$rel"
  mkdir -p "$(dirname "$TARGET_DIR/$rel")"
  if [ "$mode" = link ]; then ln -s "$src" "$TARGET_DIR/$rel"; else cp -R "$src" "$TARGET_DIR/$rel"; fi
  exclude "/$rel"
}

# 4-1. 팀 스킬: .agents/skills/* 를 Claude Code 가 찾는 .claude/skills/ 에 링크
#      (복사가 아니라 링크라서 팀 스킬이 갱신되면 그대로 반영된다)
for skill in "$TARGET_DIR"/.agents/skills/*/; do
  [ -f "$skill/SKILL.md" ] || continue
  name="$(basename "$skill")"
  install_entry "../../.agents/skills/$name" ".claude/skills/$name" link
  info "✅ Team skill   → .claude/skills/$name (link)"
done

# 4-2. 개인 스킬
for skill in "$HARNESS_DIR"/skills/*/; do
  name="$(basename "$skill")"
  install_entry "$skill" ".claude/skills/$name"
  info "✅ My skill     → .claude/skills/$name"
done

# 4-3. 개인 서브에이전트
for agent in "$HARNESS_DIR"/agents/*.md; do
  [ -f "$agent" ] || continue
  name="$(basename "$agent")"
  install_entry "$agent" ".claude/agents/$name"
  info "✅ My subagent  → .claude/agents/$name"
done

# 4-4. 개인 지침: CLAUDE.local.md 에서 공통 지침 + 프로필 지도 import
CLAUDE_LOCAL="$TARGET_DIR/CLAUDE.local.md"
for IMPORT_LINE in "@$HARNESS_NAME/AGENTS.md" "@$HARNESS_NAME/profile/AGENTS.md"; do
  grep -qxF "$IMPORT_LINE" "$CLAUDE_LOCAL" 2>/dev/null || printf '%s\n' "$IMPORT_LINE" >> "$CLAUDE_LOCAL"
done
exclude "/CLAUDE.local.md"
info "✅ My rules     → CLAUDE.local.md (@$HARNESS_NAME/AGENTS.md, @$HARNESS_NAME/profile/AGENTS.md)"

# 4-5. 훅·권한 규칙: .claude/settings.local.json 에 병합 (기존 개인 설정은 유지)
SETTINGS_LOCAL=".claude/settings.local.json"
if is_tracked "$SETTINGS_LOCAL"; then
  warn "$SETTINGS_LOCAL 은 팀 저장소 파일이라 훅을 등록하지 않았습니다."
else
  mkdir -p "$TARGET_DIR/.claude"
  bun "$HARNESS_DIR/scripts/merge-settings.ts" "$TARGET_DIR/$SETTINGS_LOCAL" \
    "$HARNESS_DIR/settings.harness.json" "$HARNESS_DIR/profile/profile.json"
  exclude "/$SETTINGS_LOCAL"
  info "✅ My hooks     → $SETTINGS_LOCAL"
fi

info ""
info "✨ Harness installed. 화면 작업은 요청서로 시작하세요:"
info "   bash $HARNESS_NAME/scripts/new-task.sh main-hero \"메인 히어로 섹션\""
