// 훅 공통 유틸. Claude Code 는 훅 입력을 stdin JSON 으로 넘긴다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
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
