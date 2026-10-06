// PreToolUse: 하네스 자신을 지킨다. 영수증·상태 파일은 차단하고, 설치본·연결 파일 수정은 확인을 받는다.
import { readInput, projectDir, relativePath, block, output } from './lib.ts';

const STATE = /\.my-harness\/(\.state|evidence)\b|receipt\.json/;
const INSTALLED = /^(\.my-harness\/(?!tasks\/)|\.claude\/settings(\.local)?\.json$|CLAUDE\.local\.md$)/;

const input = readInput();
const t = input.tool_input ?? {};
const target = input.tool_name === 'Bash' ? (t.command ?? '') : relativePath(projectDir(input), t.file_path ?? t.notebook_path ?? '');

if (STATE.test(target))
  block('🔒 [my-harness] 하네스 상태 파일은 직접 다루지 않습니다. 게이트가 잘못 막는다고 보이면 사용자에게 알리세요.');

if (input.tool_name !== 'Bash' && INSTALLED.test(target)) {
  output({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: `[my-harness] ${target} 은 하네스 설치본·연결 파일입니다. 하네스는 원본 frontend-harness 에서 고칩니다.`,
    },
  });
}
