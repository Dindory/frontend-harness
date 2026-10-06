// Stop: 이 턴에 코드가 바뀌었다면 검증 영수증과 요청서 기록이 있어야 턴을 끝낼 수 있다.
// 통과하면 증거 파일을 지운다 (결과 요약은 요청서에 남아 있다).
import fs from 'node:fs';
import path from 'node:path';
import {
  readInput,
  projectDir,
  output,
  stateFile,
  activeTaskFile,
  tasksModifiedSince,
  harnessDir,
  codeFingerprint,
  receiptFile,
  loadProfile,
  type Receipt,
} from './lib.ts';

const input = readInput();

let state: { startedAt: number; codeHash: string };
try {
  state = JSON.parse(fs.readFileSync(stateFile(input.session_id), 'utf8'));
} catch {
  process.exit(0); // 턴 시작 스냅샷이 없으면 판단하지 않는다
}

// 화면 요청서를 design-reviewer 검수 없이 보고 완료로 체크했으면 알린다 (막지는 않는다)
const unreviewed = tasksModifiedSince(state.startedAt)
  .filter((f) => {
    const text = fs.readFileSync(f, 'utf8');
    return /^- \[x\] 보고/m.test(text) && /figma\.com\//.test(text) && !/^- \[x\] design-reviewer/m.test(text);
  })
  .map((f) => `\n⚠️ ${path.basename(f)}: design-reviewer 검수 없이 보고 완료`)
  .join('');

const root = projectDir(input);
if (codeFingerprint(root) === state.codeHash) {
  if (unreviewed) output({ systemMessage: `[my-harness]${unreviewed}` });
  process.exit(0);
}

let receipt: Receipt | null = null;
try {
  receipt = JSON.parse(fs.readFileSync(receiptFile(input.session_id), 'utf8'));
} catch {}

const steps = (list: string[]) => [...new Set(list.map((s) => s.slice(s.lastIndexOf(':') + 1)))];
const ran = steps(receipt?.ran ?? []);
const missing = (loadProfile()?.verify?.required ?? []).filter((r) => !ran.includes(r));

const problems: string[] = [];
if (!receipt || receipt.at < state.startedAt)
  problems.push('이 턴에 검증을 실행한 기록이 없다. `bash .my-harness/scripts/run-tests.sh` 를 단독으로 실행한다.');
else if (receipt.result !== 'PASS')
  problems.push('검증이 실패했다. 고치고 다시 실행하거나, 못 고치면 사유를 요청서 "확인하지 못한 것"에 적는다.');
else if (receipt.only) problems.push(`일부 단계(--only ${receipt.only})만 검증했다. 전체를 다시 실행한다.`);
else if (!ran.length) problems.push('검증 단계가 모두 건너뛰어졌다.');
else if (missing.length) problems.push(`필수 검증 단계가 실행되지 않았다: ${missing.join(', ')}`);
else if (receipt.codeHash !== codeFingerprint(root)) problems.push('검증 뒤에 코드가 또 바뀌었다. 다시 실행한다.');

const task = activeTaskFile();
if (task && fs.statSync(task).mtimeMs < state.startedAt)
  problems.push(`활성 요청서(.my-harness/tasks/${path.basename(task)})에 이 턴의 진행 기록이 없다.`);

if (problems.length) {
  const list = problems.map((p) => `- ${p}`).join('\n');
  // 한 번 막은 뒤에도 못 채웠으면 무한 루프 대신 사용자에게 보이고 끝낸다
  if (input.stop_hook_active) output({ systemMessage: `⚠️ [my-harness] 검증 조건을 못 채우고 끝났습니다:\n${list}${unreviewed}` });
  output({ decision: 'block', reason: `[my-harness] 턴 종료 점검 실패:\n${list}` });
}

const skipped = steps(receipt!.skipped).filter((s) => !ran.includes(s));
fs.rmSync(path.join(harnessDir, 'evidence', 'latest.md'), { force: true });
fs.rmSync(receiptFile(input.session_id), { force: true });
fs.writeFileSync(stateFile(input.session_id), JSON.stringify({ ...state, codeHash: codeFingerprint(root) }));
output({
  systemMessage: `✅ [my-harness] 검증 확인 (실행: ${ran.join(', ')}${skipped.length ? ` · 건너뜀: ${skipped.join(', ')}` : ''}) → 증거 삭제${unreviewed}`,
});
