# 프로필 지도 — yonsei88

yonsei88 병원 홈페이지. 루트에 Next.js 앱 하나가 있는 레포다. **팀 문서·공통 패키지·팀 스킬이 없다.** 그래서 이 지도의 ✅ 는 레포에서 직접 확인한 사실이고, 🟡 는 내가 정한 기본값이다.

## 프로젝트 개요

| 항목 | 값 | 상태 |
|---|---|---|
| 구조 | 루트 단일 앱 (`app/`, `components/`, `hooks/`, `util/`, `public/`, `fonts/`) | ✅ |
| 패키지 매니저 | Bun (`bun.lock`) | ✅ |
| 프레임워크 | Next.js 16 App Router, React 19 | ✅ `package.json` |
| 스타일 | Tailwind CSS 4 (`@tailwindcss/postcss`), 클래스 병합은 `cn()` (`util/style.ts`) | ✅ |
| 애니메이션 | framer-motion | ✅ |
| 언어 | TypeScript strict | ✅ `tsconfig.json` |
| lint | ESLint 9 + `eslint-config-next` | ✅ |
| 테스트 러너 | **없음** | ✅ |
| 포매터 | 설정 없음 (`format` 훅은 동작하지 않는다) | ✅ |

## 명령어

```bash
bun install --frozen-lockfile
bun run dev                             # http://localhost:3000
bun run lint
bunx tsc --noEmit                       # typecheck 스크립트가 없어서 직접 실행
bash .my-harness/scripts/run-tests.sh   # 검증 = typecheck + lint (테스트 러너 없음)
```

## 코딩 컨벤션

- ✅ 컴포넌트는 `components/{common,home,layout}/` 에 camelCase 파일명으로 둔다 (`navMenuItem.tsx`, `mainSection.tsx`).
- ✅ 페이지는 `app/<route>/page.tsx` (현재 `community`, `intro`).
- ✅ 고정폭 시안은 `hooks/useScale.tsx` (기준 너비 1920) 를 쓴다. 사용 예: `components/home/doctor.tsx`.
- 🟡 새 컴포넌트를 만들기 전에 `components/common/` 에서 재사용할 것을 찾는다 (`sectionTitle`, `logoMark`).
- 🟡 `useScale` 은 고정폭 데스크톱 시안일 때만 쓰고, 모바일은 별도 flow 로 만든다 (플랫폼 팀 규칙을 기본값으로 가져옴).
- ✅ Figma 실제 에셋을 라이브러리 아이콘으로 몰래 대체하지 않는다. 에셋은 `public/` 에 있다.
- 🟡 커밋: 최근 기록 형식 `Type: 한국어 요약` (대문자 시작, 예: `Feat: 검색 버튼 추가`, `Asset: svg 파일 추가`) → `commit` 스킬.

## 금지 규칙

- ✅ 환자·상담 개인정보를 코드·문서·로그에 넣지 않는다.
- ✅ 운영 사이트·Vercel 설정·DB 를 건드리지 않는다 (`vercel` 명령은 확인 요청).
- 🟡 공통 유틸(`hooks/`, `util/`), `app/layout.tsx`, 설정 파일은 수정 전에 확인을 받는다 (훅이 확인을 요청함).

## 어디를 볼지

| 찾는 것 | 위치 |
|---|---|
| 팀 문서 | 없음. `README.md` 는 create-next-app 기본 문서다 |
| Figma 구현 절차 | 팀 문서 없음 → `new-section` 스킬의 기본 절차 |
| 레이아웃 판단 | `hooks/useScale.tsx` + 위 컨벤션 |
| 공통 레이아웃·네비 | `app/layout.tsx`, `components/layout/` |
| 섹션 예시 | `components/home/` |
| 내 작업 요청서 | `.my-harness/tasks/` (사이트 ID: `yonsei88`) |

## 검증 기준

턴 종료 게이트가 요구하는 필수 단계: **typecheck, lint** (`profile.json` 의 `verify.required`). 테스트 러너가 없으므로 동작·화면 확인은 검증에 포함되지 않는다. 보고할 때 "검증 PASS (typecheck, lint)" 처럼 범위를 밝히고, 화면 확인은 `design-reviewer` 나 직접 실행 결과로 따로 쓴다.
