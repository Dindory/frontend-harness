#!/usr/bin/env bash
# 프로젝트 루트에서 실행: bash .my-harness/scripts/run-tests.sh [--cwd <dir>] [--only <step>] [--e2e]
#   step: typecheck | lint | unit | e2e
#   --cwd 가 없고 루트에 package.json 도 없으면 apps/*, packages/* 중 변경된 곳을 검증한다.
set -uo pipefail

RUN_E2E="${HARNESS_E2E:-0}"
ONLY=""
DIRS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --e2e) RUN_E2E=1 ;;
    --only) ONLY="${2:-}"; shift ;;
    --cwd) DIRS="$DIRS ${2:-}"; shift ;;
    -h|--help) sed -n '2,4p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done
[ "$ONLY" = "e2e" ] && RUN_E2E=1

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

# --- 검증 대상 디렉터리 결정 -------------------------------------------------
if [ -z "$DIRS" ]; then
  if [ -f package.json ]; then
    DIRS="."
  else
    CANDIDATES="$(ls -d apps/*/ packages/*/ 2>/dev/null | sed 's#/$##')"
    BASE_REF="$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main)"
    MERGE_BASE="$(git merge-base HEAD "$BASE_REF" 2>/dev/null || true)"
    CHANGED="$( { [ -n "$MERGE_BASE" ] && git diff --name-only "$MERGE_BASE"; git ls-files --others --exclude-standard; } 2>/dev/null)"
    for d in $CANDIDATES; do
      [ -f "$d/package.json" ] || continue
      printf '%s\n' "$CHANGED" | grep -q "^$d/" && DIRS="$DIRS $d"
    done
    if [ -z "$DIRS" ]; then
      for d in $CANDIDATES; do [ -f "$d/package.json" ] && DIRS="$DIRS $d"; done
    fi
  fi
fi
if [ -z "$DIRS" ]; then
  echo "❌ 검증할 package.json 을 찾지 못했습니다." >&2
  exit 2
fi

has_script() {
  node -e 'const s=require("./package.json").scripts||{};process.exit(s[process.argv[1]]?0:1)' "$1"
}
has_dep() {
  node -e 'const p=require("./package.json");const d={...p.dependencies,...p.devDependencies};process.exit(d[process.argv[1]]?0:1)' "$1"
}
lockfile() { [ -f "$1" ] || [ -f "$ROOT/$1" ]; }

SUMMARY=""
FAILED=0
RAN=""
SKIPPED=""

run_step() { # name, command...
  local name="$1"; shift
  echo ""
  echo "━━━ ▶ [$DIR] $name: $*"
  RAN="$RAN,$DIR:$name"
  if "$@"; then
    SUMMARY="$SUMMARY\n  ✅ [$DIR] $name"
  else
    SUMMARY="$SUMMARY\n  ❌ [$DIR] $name"
    FAILED=1
  fi
}
skip_step() { SKIPPED="$SKIPPED,$DIR:$1"; SUMMARY="$SUMMARY\n  ⏭️  [$DIR] $1 (skipped: $2)"; }
want() { [ -z "$ONLY" ] || [ "$ONLY" = "$1" ]; }

for DIR in $DIRS; do
  cd "$ROOT/$DIR" || { SUMMARY="$SUMMARY\n  ❌ [$DIR] 디렉터리 없음"; FAILED=1; continue; }

  if   lockfile bun.lock || lockfile bun.lockb; then PM=bun; EXEC="bunx"
  elif lockfile pnpm-lock.yaml;                 then PM=pnpm; EXEC="pnpm exec"
  elif lockfile yarn.lock;                      then PM=yarn; EXEC="yarn"
  else                                               PM=npm;  EXEC="npx --no-install"
  fi

  if [ ! -d node_modules ] && [ ! -d "$ROOT/node_modules" ]; then
    echo "⚠️  [$DIR] node_modules 가 없습니다. 먼저 의존성을 설치하세요 ($PM install)."
  fi

  if want typecheck; then
    if   has_script typecheck;  then run_step typecheck $PM run typecheck
    elif has_script type-check; then run_step typecheck $PM run type-check
    elif [ -f tsconfig.json ];  then run_step typecheck $EXEC tsc --noEmit
    else skip_step typecheck "no tsconfig"
    fi
  fi

  if want lint; then
    if has_script lint; then run_step lint $PM run lint
    else skip_step lint "no lint script"
    fi
  fi

  if want unit; then
    if   has_script test:unit; then run_step unit $PM run test:unit
    elif has_script test;      then CI=true run_step unit $PM run test
    elif has_dep vitest;       then run_step unit $EXEC vitest run
    else skip_step unit "no test runner"
    fi
  fi

  if want e2e; then
    if [ "$RUN_E2E" != "1" ]; then skip_step e2e "use --e2e"
    elif has_script test:e2e;      then run_step e2e $PM run test:e2e
    elif has_dep @playwright/test; then run_step e2e $EXEC playwright test
    else skip_step e2e "no playwright"
    fi
  fi
done

echo ""
echo "━━━ Summary"
printf '%b\n' "$SUMMARY"
echo ""

# 턴 종료 게이트(turn-gate)가 읽는 증거. 통과 후 게이트가 지운다.
EVIDENCE_DIR="$ROOT/.my-harness/evidence"
mkdir -p "$EVIDENCE_DIR"
{
  echo "# 검증 증거"
  echo "- 시각: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "- 대상:${DIRS}"
  echo "- 결과: $([ "$FAILED" -ne 0 ] && echo FAIL || echo PASS)"
  printf '%b\n' "$SUMMARY"
} > "$EVIDENCE_DIR/latest.md"

# 하네스(record-receipt)가 읽는 판정 줄. 사람이 아니라 훅이 읽는다.
DIRS_CSV="$(echo $DIRS | tr ' ' ',')"
echo "HARNESS_RESULT result=$([ "$FAILED" -ne 0 ] && echo FAIL || echo PASS) only=${ONLY} dirs=${DIRS_CSV} ran=${RAN#,} skipped=${SKIPPED#,}"

if [ "$FAILED" -ne 0 ]; then
  echo "❌ Verification failed"
  exit 1
fi
echo "✅ All checks passed"
