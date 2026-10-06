# 프로필 지도 — hospital-web-platform

이 파일은 **지도**다. 자세한 규칙은 링크된 팀 문서가 정본이다.
🟡임시 항목은 팀이 아직 정하지 않아서 내가 임의로 정한 기본값이다. 팀 문서에 다른 내용이 보이면 팀 문서를 따르고 나에게 알린다.

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
bash .my-harness/scripts/run-tests.sh # 변경된 곳만 한 번에 검증 (루트 package.json 이 없으면 apps/*, packages/* 중 변경된 곳)
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

- ✅ 환자·상담 개인정보를 코드·문서·로그에 넣지 않는다.
- ✅ 기존 운영 사이트·Vercel 설정·DB 를 건드리지 않는다 (`vercel` 명령은 확인 요청).
- ✅ 공통 패키지·팀 정본(`packages/`, `docs/`, `.agents/`)은 확인 없이 수정하지 않는다 (훅이 확인을 요청함).
- ✅ 요청받은 사이트 밖을 같이 고치지 않는다.
- ✅ 새 병원 사이트를 시작하는 작업이면 팀 정의서(`docs/templates/site-brief.md`)가 먼저 채워져 있어야 한다. 없으면 멈추고 알린다.

## 어디를 볼지

| 찾는 것 | 위치 |
|---|---|
| 전체 계획·확정/미정 결정 | `docs/PLATFORM-PLAN.md` |
| 현재 상태·다음 작업 | `docs/PROJECT-MAP.md` |
| 기존 사이트 기술 스택 근거 | `docs/REPOSITORY-INVENTORY.md` |
| 병원별 요구 (정의서 양식) | `docs/templates/site-brief.md` |
| Figma 구현 절차 | `docs/workflows/figma-fidelity.md`, 팀 스킬 `platform-figma-fidelity` (정본) |
| 레이아웃 판단 (fluid / scale-to-fit) | `docs/workflows/scale-to-fit.md`, `packages/layout-hooks/README.md` |
| 화면 / UI 컴포넌트 | 🟡 `apps/<site>/app/`, `apps/<site>/components/ui/` (앱이 생기면 확인) |
| 내 작업 요청서 | `.my-harness/tasks/` |

## 검증 기준

`run-tests.sh` 는 변경된 앱·패키지마다 typecheck · lint · test 를 실행한다. 턴 종료 게이트가 요구하는 필수 단계: **typecheck** (`profile.json` 의 `verify.required`).
