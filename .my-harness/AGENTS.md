# 개인 하네스 지침 — hospital-web-platform

이 파일은 **지도**다. 자세한 규칙은 링크된 팀 문서가 정본이다.

> **우선순위**: 팀 문서(`README.md`, `docs/`, `.agents/skills/`) > 이 파일의 ✅확정 > 이 파일의 🟡임시
> 🟡임시 항목은 팀이 아직 정하지 않아서 내가 임의로 정한 기본값이다. 팀 문서에 다른 내용이 보이면 팀 문서를 따르고 나에게 알린다.

## 프로젝트 개요

| 항목 | 값 | 상태 |
|---|---|---|
| 프로젝트 | 병원별 홈페이지를 한 저장소에서 관리하는 플랫폼 | ✅ |
| 패키지 매니저 | Bun (`bun.lock`) | ✅ |
| 테스트 러너 | Vitest (패키지 스크립트로 실행) | ✅ |
| 프레임워크 | Next.js App Router | 🟡 기존 병원 사이트 6곳 기준 |
| 스타일 | Tailwind CSS 4, 클래스 병합은 `cn()` (`twMerge(clsx())`) | 🟡 기존 사이트 기준 |
| 언어 | TypeScript | 🟡 strict 여부는 대상 앱 tsconfig 를 따른다 |
| 병원 앱 / 루트 workspace | 아직 없음 | ✅ (`docs/PROJECT-MAP.md`) |

## 명령어

```bash
bun install --cwd <앱/패키지> --frozen-lockfile --ignore-scripts
bun run --cwd <앱/패키지> test        # ⚠️ `bun test` 아님 (Vitest 를 우회함)
bun run --cwd <앱/패키지> typecheck
bun run --cwd <앱> dev                # 🟡 앱이 생기면 확인
bash .my-harness/scripts/run-tests.sh # 변경된 곳만 한 번에 검증
```

## 코딩 컨벤션

- 🟡 **대상 앱에 이미 있는 구조·컴포넌트·네이밍을 먼저 따른다.** 아래 기본값은 앱에 기준이 없을 때만 쓴다.
- 🟡 화면은 `app/` 아래 App Router 파일 규칙으로 만든다.
- 🟡 새 UI 를 만들기 전에 앱의 `components/ui/` 와 공통 패키지(`packages/*`)에서 재사용할 것을 찾는다.
- ✅ 병원별 색·레이아웃·아이콘 정책은 그 병원 앱에 둔다. 공통 패키지에 넣지 않는다.
- ✅ `useScale` 은 고정폭 데스크톱 시안일 때만 쓴다. 모바일은 별도 flow (`docs/workflows/scale-to-fit.md`).
- ✅ Figma 실제 에셋을 라이브러리 아이콘으로 몰래 대체하지 않는다.
- ✅ README·팀 문서는 한글로 쓴다.
- 🟡 커밋: 레포의 커밋 규칙·최근 기록을 먼저 따르고, 없으면 `type: 한국어 요약`(소문자 type, 마침표 없음) → `commit` 스킬. 이 레포는 팀이 정한 규칙이 아직 없다.

## 금지 규칙

- ✅ `.env*` 파일·비밀값을 읽거나 출력하거나 커밋하지 않는다 (훅으로 차단됨). 환경변수는 **이름만** 다룬다.
- ✅ 환자·상담 개인정보를 코드·문서·로그에 넣지 않는다.
- ✅ 기존 운영 사이트·Vercel 설정·DB 를 건드리지 않는다.
- ✅ 공통 패키지·팀 정본(`packages/`, `docs/`, `.agents/`)은 확인 없이 수정하지 않는다 (훅이 확인을 요청함).
- ✅ 요청받은 사이트·페이지·노드 밖을 같이 고치지 않는다.
- 테스트 삭제·skip, `any`·`@ts-ignore` 우회, `node_modules` 수정 금지.

## 어디를 볼지

| 찾는 것 | 위치 |
|---|---|
| 전체 계획·확정/미정 결정 | `docs/PLATFORM-PLAN.md` |
| 현재 상태·다음 작업 | `docs/PROJECT-MAP.md` |
| 기존 사이트 기술 스택 근거 | `docs/REPOSITORY-INVENTORY.md` |
| 병원별 요구 (정의서 양식) | `docs/templates/site-brief.md` |
| Figma 구현 절차 | `docs/workflows/figma-fidelity.md` |
| scale-to-fit / `useScale` | `docs/workflows/scale-to-fit.md`, `packages/layout-hooks/README.md` |
| 화면 / UI 컴포넌트 | 🟡 `apps/<site>/app/`, `apps/<site>/components/ui/` (앱이 생기면 확인) |
| 내 작업 요청서 | `.my-harness/tasks/` |

## 작업 요청서 (exec plan)

화면 작업은 요청서 한 장으로 시작한다. 양식: `.my-harness/templates/task.md`

```bash
bash .my-harness/scripts/new-task.sh <slug>   # .my-harness/tasks/YYYY-MM-DD-<slug>.md 생성
```

- 요청서가 있으면 그 파일이 이 작업의 정본이다. 진행 기록·결정·질문을 요청서에 계속 적는다.
- 요청서 없이 채팅으로 요청받았으면, 양식의 필수 항목 중 빠진 것을 먼저 묻는다.
- 새 병원 사이트를 시작하는 작업이면 팀 정의서(`site-brief.md`)가 먼저 채워져 있어야 한다. 없으면 멈추고 알린다.

## 스킬과 서브에이전트

| 이름 | 언제 |
|---|---|
| `new-section` | 요청서 → 페이지/섹션 구현 (팀 `platform-figma-fidelity` 를 따름) |
| `verify` | 코드 수정 후, 완료 보고 전 |
| `design-reviewer` (서브에이전트) | UI 구현 후 독립 검수 |
| `review` | 커밋/PR 전 코드 리뷰 체크리스트 |
| `commit` | 커밋 메시지 작성·커밋 |
| `cleanup` | 작업 마무리 정리, 문서 링크 점검 |

## 훅 (자동 실행)

- 턴 시작: 입력을 `context-map.json` 과 대조해 관련 문서·활성 요청서를 알려 준다 (`route-context`)
- 턴 종료: 코드가 바뀐 턴은 `run-tests.sh` 실행 영수증(PASS, 코드 변경 없음)과 요청서 갱신이 없으면 막는다. 영수증은 하네스가 도구 실행을 보고 기록한다 (`record-receipt`). 통과하면 증거를 지운다 (`turn-gate`)
- 세션 시작: 팀 문서가 하네스 기준 시점 이후 바뀌었으면 알림 → 🟡 항목을 다시 확인할 것
- `.env*`·키 파일 접근 차단 / `packages/`·`docs/`·`.agents/` 수정 시 확인 요청
- 파일 수정 후 프로젝트 포매터 실행 (설정돼 있을 때만)
- 응답이 끝날 때마다 변경 파일 목록 표시

## 보고 형식

확인한 사실과 **확인하지 못한 것**을 나눠 쓴다. 실행한 검증 명령과 결과를 쓴다. 실제 화면·Figma 대조 없이 "디자인과 동일"이라고 쓰지 않는다.

## PR

내가 요청했을 때만. `.my-harness/templates/pr-body.md` 양식 → `bash .my-harness/scripts/create-pr.sh --title "..." --body-file <파일>` (기본 Draft)
