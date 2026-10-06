# 개인 하네스 지침 — 공통 (frontend-harness)

프로젝트 사실(스택·명령어·구조·어디를 볼지)은 프로필 지도 `.my-harness/profile/AGENTS.md` 에 있다.

> **우선순위**: 팀 문서 > 프로필 ✅ > 프로필 🟡 > 이 파일. 프로필 지도와 레포가 다르면 레포를 따르고 나에게 알린다.

## 하네스 자체

- `.my-harness/` 는 원본 `frontend-harness` 의 설치본이다. 고칠 일이 있으면 원본에서 고치고 `install.sh` 로 다시 설치한다.
- 게이트가 잘못 막는다고 판단되면 우회하지 말고 나에게 알린다.

## 공통 금지

- `.env*`·비밀값을 읽거나 출력하거나 커밋하지 않는다. 환경변수는 이름만 다룬다.
- 테스트 삭제·skip, `any`·`@ts-ignore` 우회, `node_modules` 수정 금지.
- 요청받은 범위 밖을 같이 고치지 않는다.

## 작업 요청서

화면 작업은 요청서 한 장으로 시작한다: `bash .my-harness/scripts/new-task.sh <slug>`

- 요청서가 이 작업의 정본이다. 진행 기록·결정·질문을 계속 적는다.
- 채팅으로만 요청받았으면 양식의 ★ 항목 중 빠진 것을 먼저 묻는다.

## 검증

`bash .my-harness/scripts/run-tests.sh` 를 **단독으로** 실행한다. 하네스가 결과를 보고 영수증을 남기고, 턴 종료 때 확인한다.

- `--only` 로 일부만 돌린 결과와 프로필의 필수 단계가 빠진 결과는 인정되지 않는다.
- 보고할 때 실제로 실행된 단계를 쓴다. 예: "검증 PASS (typecheck, lint)".

## 스킬과 서브에이전트

| 이름 | 언제 |
|---|---|
| `new-section` | 요청서 → 페이지/섹션 구현 |
| `verify` | 코드 수정 후, 완료 보고 전 |
| `design-reviewer` | UI 구현 후 독립 검수 (화면 요청서를 보고 완료로 체크하기 전) |
| `review` | 커밋/PR 전 체크리스트 |
| `commit` | 커밋 |
| `cleanup` | 마무리 정리 |

## 훅

- 세션 시작: 프로필이 레포와 맞는지(`profile-check`), 팀 문서 변경(`team-drift`)
- 턴 시작: 관련 문서·활성 요청서 안내(`route-context`)
- 도구 실행 전: 비밀 파일 차단, 하네스 상태 파일 차단, 보호 경로 수정 확인
- 턴 종료: 코드가 바뀐 턴은 검증 영수증과 요청서 갱신을 확인(`turn-gate`)

## 보고 형식

확인한 사실과 **확인하지 못한 것**을 나눠 쓴다. 실제 화면·Figma 대조 없이 "디자인과 동일"이라고 쓰지 않는다.

## PR

내가 요청했을 때만. `.my-harness/templates/pr-body.md` → `bash .my-harness/scripts/create-pr.sh --title "..." --body-file <파일>` (기본 Draft)
