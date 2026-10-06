// PostToolUse(Bash): Claude 가 run-tests.sh 를 실제로 실행한 사실을 하네스가 직접 기록한다 (영수증).
// 증거 파일은 Claude 가 손으로 쓸 수 있지만, 이 영수증은 도구 실행을 관찰해서만 만들어진다.
import fs from 'node:fs';
import path from 'node:path';
import { readInput, projectDir, codeFingerprint, receiptFile, type Receipt } from './lib.ts';

const input = readInput();
const command = input.tool_input?.command ?? '';
if (!/run-tests\.sh/.test(command)) process.exit(0);

// 응답 형태(문자열/객체)와 무관하게 출력 전체에서 스크립트의 마지막 판정 줄을 찾는다
const text = typeof input.tool_response === 'string' ? input.tool_response : JSON.stringify(input.tool_response ?? '');
const passed = text.includes('✅ All checks passed');
const failed = text.includes('❌ Verification failed');
if (!passed && !failed) process.exit(0); // 판정 줄이 없으면(중단·인자 오류 등) 영수증을 만들지 않는다

const receipt: Receipt = {
  at: Date.now(),
  command: command.slice(0, 200),
  result: passed && !failed ? 'PASS' : 'FAIL',
  codeHash: codeFingerprint(projectDir(input)),
};
try {
  fs.mkdirSync(path.dirname(receiptFile(input.session_id)), { recursive: true });
  fs.writeFileSync(receiptFile(input.session_id), JSON.stringify(receipt));
} catch {}
