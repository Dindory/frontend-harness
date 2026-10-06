---
name: verify
description: 코드 수정 후 typecheck·lint·Vitest(·Playwright)를 실행해 자가 검증하고, 실패하면 고쳐서 통과할 때까지 반복한다. 코드 변경을 마무리하거나 PR 을 만들기 전에 사용.
---

# Verify

## 실행

```bash
bash .my-harness/scripts/run-tests.sh                   # 전체 (턴 종료 게이트는 이것만 인정)
bash .my-harness/scripts/run-tests.sh --cwd <디렉터리>  # 특정 앱·패키지
bash .my-harness/scripts/run-tests.sh --only typecheck  # 특정 단계만 (빠른 재실행용)
bash .my-harness/scripts/run-tests.sh --e2e             # + Playwright
```

- 다른 명령과 섞지 말고 단독으로 실행한다 (파이프·`&&`·리다이렉트가 있으면 영수증이 안 나온다).
- 루트에 `package.json` 이 없으면 `apps/*`, `packages/*` 중 **기본 브랜치 대비 변경된 곳**만 검증한다.
- 각 디렉터리의 `package.json` scripts(`typecheck`, `lint`, `test` …)를 lockfile 에 맞는 패키지 매니저로 실행한다. Bun 프로젝트에서 `bun test` 를 직접 쓰지 않는다.

## 루프 규칙

1. 실패한 첫 단계의 출력을 읽고 원인을 고친다.
2. `--cwd` / `--only` 로 실패한 곳만 빠르게 재실행하고, 통과하면 전체를 다시 돌린다.
3. 같은 오류로 3회 연속 실패하면 멈추고 보고한다.
4. 금지: 테스트 삭제/skip, `any`·`@ts-ignore`·`eslint-disable` 로 우회, 스냅샷 무조건 갱신.
5. 내가 건드리지 않은 곳에서 원래부터 실패하던 항목은 고치지 말고 보고만 한다.

6. 마지막에는 옵션 없이 전체를 실행한다. 턴 종료 게이트가 영수증(PASS, 필수 단계 포함, 이후 코드 변경 없음)을 확인한다. 통과 결과는 요청서 진행 기록에 실행된 단계와 함께 요약한다.
