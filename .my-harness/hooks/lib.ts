// 훅 공통 유틸. Claude Code 는 훅 입력을 stdin JSON 으로 넘긴다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import type { HookInput, HookOutput } from './types.ts';

export function readInput(): HookInput {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}') as HookInput;
  } catch {
    return {};
  }
}

export function projectDir(input: HookInput): string {
  return process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
}

function realpath(p: string): string | null {
  try {
    return fs.realpathSync(p);
  } catch {
    return null;
  }
}

/** 심볼릭 링크(.claude/skills → .agents/skills)를 따라간 프로젝트 기준 상대 경로 */
export function relativePath(root: string, file: string): string {
  const abs = path.resolve(root, file);
  const resolved =
    realpath(abs) ?? path.join(realpath(path.dirname(abs)) ?? path.dirname(abs), path.basename(abs));
  return path.relative(realpath(root) ?? root, resolved);
}

/** 실패하면 null, 성공하면 trim 된 stdout (빈 문자열일 수 있음) */
export function git(root: string, args: string[]): string | null {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

/** exit 2 + stderr: 도구 실행을 막고 이유를 Claude 에게 전달 */
export function block(message: string): never {
  process.stderr.write(message + '\n');
  process.exit(2);
}

export function output(obj: HookOutput): never {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

/** 하네스 폴더(.my-harness) 절대 경로 */
export const harnessDir = path.join(import.meta.dirname, '..');

export function stateFile(sessionId: string | undefined): string {
  return path.join(harnessDir, '.state', `${sessionId || 'unknown'}.json`);
}

/** 가장 최근 요청서 중 '보고' 항목이 아직 체크되지 않은 것 (절대 경로) */
export function activeTaskFile(): string | null {
  const dir = path.join(harnessDir, 'tasks');
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort().reverse();
  for (const f of files) {
    if (!/^- \[x\] 보고/m.test(fs.readFileSync(path.join(dir, f), 'utf8'))) return path.join(dir, f);
  }
  return null;
}

/** 현재 코드 상태의 지문: 하네스 파일을 뺀 변경 내용 전체(추적·미추적)의 해시. 내용이 바뀌면 달라진다. */
export function codeFingerprint(root: string): string {
  const h = createHash('sha256');
  h.update(git(root, ['diff', 'HEAD', '--', '.', ':(exclude).my-harness']) ?? '');
  const untracked = (git(root, ['ls-files', '--others', '--exclude-standard', '--', '.', ':(exclude).my-harness']) ?? '')
    .split('\n')
    .filter(Boolean)
    .sort();
  for (const f of untracked) {
    h.update(`\0${f}\0`);
    try {
      h.update(fs.readFileSync(path.join(root, f)));
    } catch {}
  }
  return h.digest('hex').slice(0, 16);
}

export interface Receipt {
  at: number;
  command: string;
  result: 'PASS' | 'FAIL';
  codeHash: string;
}

export function receiptFile(sessionId: string | undefined): string {
  return path.join(harnessDir, '.state', `${sessionId || 'unknown'}.receipt.json`);
}
