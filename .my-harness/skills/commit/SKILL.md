---
name: commit
description: 변경사항을 커밋한다. 레포에 커밋 규칙이 있으면 그것을 따르고, 없으면 기본 형식(type: 한국어 요약, 마침표 없음)을 쓴다. 사용자가 커밋을 요청했을 때 사용.
---

# Commit

## 0. 레포의 규칙이 먼저다

```bash
git log --format=%s -10
ls .commitlintrc* commitlint.config.* .husky/commit-msg docs/commit-rules.md 2>/dev/null
```

- 규칙 문서·commitlint 설정이 있으면 **그것만** 따른다. (예: medivance 는 `Feat:` 처럼 **대문자** 14종 type 을 쓰고 husky 가 검사한다.)
- 문서는 없지만 최근 기록에 일관된 형식이 있으면 그 형식을 따른다.
- 둘 다 없을 때만 아래 기본 형식을 쓴다.

## 기본 형식

```
<type>: <한국어 요약>

<필요하면 본문: 무엇을 왜 바꿨는지, 한국어>
```

- 요약은 50자 안팎, **마침표 없음**. 한국어는 내 선호이며 팀이 정한 규칙은 아니다.
- type(소문자): `feat` 기능 · `fix` 버그 · `docs` 문서 · `refactor` 동작 변화 없는 구조 변경 · `style` 포맷만 · `test` 테스트 · `chore` 설정·의존성
- 예: `feat: 메인 히어로 섹션 추가`, `fix: 모바일 메뉴 겹침 수정`, `docs: 한글 README와 플랫폼 진행 문서 현행화`

## 절차

1. `git status`, `git diff` 로 변경을 확인한다. 성격이 다른 변경이 섞여 있으면 나눠서 커밋할지 묻는다.
2. `.env*`, 키 파일, `.my-harness/`, `CLAUDE.local.md`, `.claude/` 아래 개인 파일이 스테이징되지 않았는지 확인한다.
3. 커밋 전에 `verify` 를 돌리지 않았으면 먼저 돌린다.
4. 파일을 이름으로 지정해서 `git add` 한다 (`git add -A` / `git add .` 쓰지 않는다).
5. 커밋 후 `git log -1 --stat` 결과를 보여준다.

push 는 따로 요청받았을 때만 한다.
