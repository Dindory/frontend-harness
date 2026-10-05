---
name: cleanup
description: 작업 마무리나 주기 점검 때 이번 브랜치에서 생긴 군더더기(안 쓰는 코드·파일, 디버그 코드)와 깨진 문서 링크, 오래된 작업 요청서를 정리한다. "정리해줘", PR 전 마무리에 사용.
---

# Cleanup

**이번 브랜치에서 내가 바꾼 범위만** 정리한다. 원래 있던 코드의 군더더기는 목록으로 보고만 한다.

## 1. 코드

```bash
git diff --name-only origin/main...HEAD; git status --short
```

변경된 파일에서:
- 안 쓰는 import·변수·함수·컴포넌트 파일
- `console.log`, 디버그용 border/배경색, 임시 하드코딩 값
- 주석 처리된 코드

## 2. 문서 링크

```bash
bash .my-harness/scripts/check-links.sh
```

깨진 상대 링크가 내 변경 때문이면 고치고, 원래부터 깨져 있었으면 보고만 한다.

## 3. 작업 요청서

`.my-harness/tasks/` 에서 진행 기록이 전부 체크된 요청서는 `tasks/done/` 으로 옮긴다.
14일 넘게 갱신되지 않은 미완료 요청서는 목록으로 보고한다.

## 4. 검증

정리 후 `verify` 를 다시 돌린다. 정리 때문에 동작이 바뀌면 안 된다.
