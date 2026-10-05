# frontend-harness

Figma 기반 화면 구현, 셀프 검증, PR 자동화를 위한 **개인용** Claude Code 하네스.
현재는 [hospital-web-platform](https://github.com/Medivance-dev/hospital-web-platform) 작업에 맞춰져 있다.

## 원칙

- **팀 문서가 정본이다.** 하네스의 `AGENTS.md` 는 팀 문서를 가리키는 지도이고, 팀 규칙을 복제하지 않는다.
- 팀이 아직 정하지 않은 것만 🟡**임시** 기본값으로 정해 둔다. 팀 문서와 다르면 항상 팀 문서가 이긴다.
- 규칙은 문서로만 두지 않고 가능한 것은 **훅으로 강제**한다 (비밀 파일 차단, 공통 영역 수정 확인).
- 설치된 파일은 모두 `.git/info/exclude` 에 등록되어 팀 저장소에 diff 가 남지 않는다.

## 설치 / 업데이트

필요: git, Bun (훅이 TypeScript 라서 `bun` 으로 실행한다)

타깃 프로젝트 루트에서:

```bash
bash ~/Documents/GitHub/frontend-harness/install.sh
```

다시 실행하면 최신 버전으로 덮어쓴다. `.my-harness/tasks/`(작업 요청서)와 `settings.local.json` 의 다른 개인 설정은 보존된다.

## 화면 작업 요청하는 법

**1) 요청서 만들기**

```bash
bash .my-harness/scripts/new-task.sh main-hero "메인 히어로 섹션"
# → .my-harness/tasks/2026-10-06-main-hero.md
```

**2) ★ 항목 채우기** ([양식](.my-harness/templates/task.md))

```markdown
- ★ 사이트 ID: beloa
- 병원 정의서: 없음
- ★ 대상: 메인 페이지 히어로 섹션
- ★ Figma: https://www.figma.com/design/XXXX/...?node-id=12-34
- ★ 범위 밖 (건드리지 말 것): 헤더, 푸터
- 레이아웃: 판단 맡김
- 모바일: 없음 → 판단 맡김
- ★ 완료 조건: 1920/1280/768/375 에서 overflow 없음, CTA 버튼이 /reservation 으로 이동
```

**3) Claude Code 에 전달**

```
/new-section .my-harness/tasks/2026-10-06-main-hero.md
```

요청서가 이 작업의 정본(실행 계획)이 된다. 에이전트가 진행 기록, 결정·질문 로그, 확인하지 못한 것을 채워 나가서 세션이 끊겨도 이어서 할 수 있다.
간단한 작업은 채팅으로 바로 요청해도 된다. 그러면 에이전트가 빠진 ★ 항목을 먼저 묻는다.

## 구성

| 종류 | 이름 | 역할 |
|---|---|---|
| 지침 | `AGENTS.md` | 개요 · 명령어 · 컨벤션 · 금지 · 어디를 볼지 (✅확정 / 🟡임시 구분) |
| 스킬 | `new-section` | 요청서 → 페이지/섹션 구현 |
| | `verify` | typecheck · lint · test 검증 루프 |
| | `review` | 커밋/PR 전 체크리스트 |
| | `commit` | `type: 한국어 요약` 커밋 |
| | `cleanup` | 군더더기 · 문서 링크 · 끝난 요청서 정리 |
| | 팀 스킬 2개 | `.agents/skills/*` 링크 (`platform-figma-fidelity`, `platform-scale-to-fit`) |
| 서브에이전트 | `design-reviewer` | Figma 대비 독립 검수 (수정 안 함) |
| 훅 | `team-drift` | 세션 시작 시 팀 문서 변경 알림 |
| | `protect-secrets` | `.env*`·키 파일 접근 차단 |
| | `protect-shared` | `packages/`·`docs/`·`.agents/`·README 수정 시 확인 요청 |
| | `format` | 수정 파일 포맷 (Biome/Prettier 설정 + 설치돼 있을 때만) |
| | `session-summary` | 응답 끝날 때 변경 파일 목록 |

## 팀 규칙이 바뀌었을 때

세션 시작 시 `⚠️ 팀 문서 N개가 바뀌었습니다` 가 뜨면:

1. 바뀐 팀 문서를 읽고 `.my-harness/AGENTS.md` 의 🟡 항목과 비교한다.
2. 팀이 확정한 항목은 🟡 → ✅ 로 바꾸고 값을 팀 문서에 맞춘다. (팀 문서에 있으면 링크만 남기는 게 가장 좋다)
3. 이 레포의 `.my-harness/team-baseline` 을 확인한 팀 커밋 해시로 갱신한다.
4. 커밋 후 타깃 프로젝트에서 `install.sh` 를 다시 실행한다.

## 제대로 붙었는지 확인

타깃 프로젝트에서 Claude Code 를 새로 연 뒤 `/memory` (지침 로드), `/agents` (`design-reviewer`), `/hooks` (훅 5개)로 확인한다.

## 구조

```
.my-harness/
├── AGENTS.md
├── team-baseline              # 하네스를 맞춰 둔 팀 레포 커밋
├── settings.hooks.json        # → .claude/settings.local.json 에 병합
├── skills/{new-section,verify,review,commit,cleanup}/SKILL.md
├── agents/design-reviewer.md
├── hooks/*.ts                 # Bun 으로 실행 (빌드 없음), 입출력 타입은 types.ts
├── templates/{task.md,pr-body.md}
└── scripts/
    ├── {run-tests,create-pr,new-task,check-links}.sh
    └── merge-settings.ts      # install 시 훅 설정 병합
install.sh
package.json, tsconfig.json    # 하네스 자체 타입 검사용 (타깃에는 복사되지 않음)
```

## 제거

```bash
rm -rf .my-harness .claude/skills/{verify,review,commit,cleanup,new-section} .claude/skills/platform-* \
  .claude/agents/design-reviewer.md CLAUDE.local.md
```

`.claude/settings.local.json` 에서 `.my-harness/hooks` 항목을, `.git/info/exclude` 에서 `# frontend-harness (personal)` 아래 줄을 지운다.

## 하네스 개발

```bash
bun install
bun run typecheck   # 훅·스크립트 타입 검사
```
