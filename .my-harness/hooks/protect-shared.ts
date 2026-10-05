// PreToolUse: 팀 정본·공통 패키지를 수정하려 하면 사용자 확인을 받는다.
import { readInput, projectDir, relativePath, output } from './lib.ts';

const RULES: ReadonlyArray<[RegExp, string]> = [
  [/^packages\//, '공통 패키지입니다. 영향받는 앱을 확인했나요? (팀 규칙: 공통 기능 변경은 영향 범위 확인)'],
  [/^docs\//, '팀 정본 문서입니다. 계획·설계를 바꾸면 PROJECT-MAP 과 검증 근거도 함께 갱신해야 합니다.'],
  [/^\.agents\//, '팀 공용 스킬입니다. 동작 규칙은 스킬이 아니라 docs/workflows 에서 고치는 게 팀 방식입니다.'],
  [/^README\.md$/, '팀 README 입니다.'],
];

const input = readInput();
const file = input.tool_input?.file_path;
if (!file) process.exit(0);

const rel = relativePath(projectDir(input), file);
const rule = RULES.find(([re]) => re.test(rel));
if (rule) {
  output({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: `[my-harness] ${rel} — ${rule[1]}`,
    },
  });
}
