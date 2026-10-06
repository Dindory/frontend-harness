// PreToolUse: 프로필이 지정한 공통 영역(팀 정본·공통 패키지 등)을 수정하려 하면 사용자 확인을 받는다.
import { readInput, projectDir, relativePath, output, loadProfile } from './lib.ts';

const input = readInput();
const file = input.tool_input?.file_path;
if (!file) process.exit(0);

const rel = relativePath(projectDir(input), file);
const rule = (loadProfile()?.protected ?? []).find((r) => new RegExp(r.pattern).test(rel));
if (rule) {
  output({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: `[my-harness] ${rel} — ${rule.reason}`,
    },
  });
}
