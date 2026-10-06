// Stop: 이 턴에 코드가 바뀌었다면 검증 증거와 요청서 기록이 있어야 턴을 끝낼 수 있다.
// 통과하면 증거 파일을 지운다 (결과 요약은 요청서에 남아 있다).
import fs from 'node:fs';
import path from 'node:path';
import { readInput, projectDir, output, stateFile, activeTaskFile, harnessDir, codeFingerprint, receiptFile, type Receipt } from './lib.ts';

const input = readInput();
// 한 번 막았는데도 또 끝내려 하면 무한 루프를 피하려고 통과시킨다
if (input.stop_hook_active) process.exit(0);

let state: { startedAt: number; codeHash: string };
try {
  state = JSON.parse(fs.readFileSync(stateFile(input.session_id), 'utf8'));
} catch {
  process.exit(0); // 턴 시작 스냅샷이 없으면 판단하지 않는다
}

const root = projectDir(input);
if (codeFingerprint(root) === state.codeHash) process.exit(0); // 이 턴에 작업 트리 변화 없음

const problems: string[] = [];

const evidence = path.join(harnessDir, 'evidence', 'latest.md');

// 영수증: 하네스(record-receipt)가 run-tests.sh 실행을 직접 보고 남긴 기록
let receipt: Receipt | null = null;
try {
  receipt = JSON.parse(fs.readFileSync(receiptFile(input.session_id), 'utf8'));
} catch {}

if (!receipt || receipt.at < state.startedAt)
  problems.push('이 턴에 검증을 실행한 기록이 없다. `bash .my-harness/scripts/run-tests.sh` 를 실행한다 (verify 스킬).');
else if (receipt.result !== 'PASS')
  problems.push('검증이 실패했다. 고치고 다시 실행하거나, 못 고치면 사유를 요청서 "확인하지 못한 것"에 적는다.');
else if (receipt.codeHash !== codeFingerprint(root))
  problems.push('검증을 실행한 뒤에 코드가 또 바뀌었다. `run-tests.sh` 를 다시 실행한다.');

const task = activeTaskFile();
if (task && fs.statSync(task).mtimeMs < state.startedAt)
  problems.push(`활성 요청서(.my-harness/tasks/${path.basename(task)})에 이 턴의 진행 기록·결정이 갱신되지 않았다.`);

if (problems.length)
  output({ decision: 'block', reason: `[my-harness] 턴 종료 점검 실패:\n${problems.map((p) => `- ${p}`).join('\n')}` });

fs.rmSync(evidence, { force: true });
fs.rmSync(receiptFile(input.session_id), { force: true });
fs.writeFileSync(stateFile(input.session_id), JSON.stringify({ ...state, codeHash: codeFingerprint(root) }));
output({ systemMessage: '✅ [my-harness] 검증 증거 확인, 요청서 갱신 확인 → 증거 삭제' });
