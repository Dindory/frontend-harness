---
name: verify
description: 코드 수정 후 typecheck·lint·Vitest(·Playwright)를 실행해 자가 검증하고, 실패하면 고쳐서 통과할 때까지 반복한다. 코드 변경을 마무리하거나 PR 을 만들기 전에 사용.
---

# Verify

## 실행

```bash
bash .my-harness/scripts/run-tests.sh                           # 변경된 패키지/앱 자동 감지
bash .my-harness/scripts/run-tests.sh --cwd packages/layout-hooks   # 특정 패키지
bash .my-harness/scripts/run-tests.sh --only typecheck          # 특정 단계만
bash .my-harness/scripts/run-tests.sh --e2e                     # + Playwright
```

- 루트에 `package.json` 이 없으면 `apps/*`, `packages/*` 중 **기본 브랜치 대비 변경된 곳**만 검증한다. 변경이 없으면 전부 검증한다.
- 각 디렉터리의 `package.json` scripts(`typecheck`, `lint`, `test` …)를 lockfile 에 맞는 패키지 매니저로 실행한다. Bun 프로젝트에서 `bun test` 를 직접 쓰지 않는다.

## 루프 규칙

1. 실패한 첫 단계의 출력을 읽고 원인을 고친다.
2. `--cwd` / `--only` 로 실패한 곳만 빠르게 재실행하고, 통과하면 전체를 다시 돌린다.
3. 같은 오류로 3회 연속 실패하면 멈추고 보고한다.
4. 금지: 테스트 삭제/skip, `any`·`@ts-ignore`·`eslint-disable` 로 우회, 스냅샷 무조건 갱신.
5. 내가 건드리지 않은 곳에서 원래부터 실패하던 항목은 고치지 말고 보고만 한다.
