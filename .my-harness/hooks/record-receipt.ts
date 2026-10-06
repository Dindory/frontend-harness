// PostToolUse(Bash): Claude 가 run-tests.sh 를 실제로 실행한 사실을 하네스가 직접 기록한다 (영수증).
// 다른 명령과 섞인 실행은 출력을 꾸밀 수 있어서 인정하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { readInput, projectDir, codeFingerprint, receiptFile, output, type Receipt } from './lib.ts';

const STANDALONE =
  /^\s*(?:[A-Z_][A-Z0-9_]*=\S*\s+)*bash\s+(?:\S*\/)?\.my-harness\/scripts\/run-tests\.sh(?:\s+[^;&|`$<>\n]*)?$/;
const RESULT = /^HARNESS_RESULT result=(PASS|FAIL) only=(\S*) dirs=(\S*) ran=(\S*) skipped=(\S*)\s*$/m;

const input = readInput();
const command = input.tool_input?.command ?? '';
if (!/run-tests\.sh/.test(command)) process.exit(0);

if (!STANDALONE.test(command)) {
  output({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: '[my-harness] run-tests.sh 가 다른 명령과 섞여 있어 영수증을 만들지 않았다. 단독으로 다시 실행한다.',
    },
  });
}

const res = input.tool_response as { stdout?: string } | string | undefined;
const text = typeof res === 'string' ? res : (res?.stdout ?? JSON.stringify(res ?? ''));
const m = RESULT.exec(text);
if (!m) process.exit(0);

const list = (s = '') => s.split(',').filter(Boolean);
const receipt: Receipt = {
  at: Date.now(),
  result: m[1] === 'PASS' ? 'PASS' : 'FAIL',
  codeHash: codeFingerprint(projectDir(input)),
  only: m[2] ?? '',
  ran: list(m[4]),
  skipped: list(m[5]),
};
try {
  fs.mkdirSync(path.dirname(receiptFile(input.session_id)), { recursive: true });
  fs.writeFileSync(receiptFile(input.session_id), JSON.stringify(receipt));
} catch {}
