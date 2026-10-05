// PreToolUse: .env 와 키 파일 접근을 차단한다.
import path from 'node:path';
import { readInput, block } from './lib.ts';

const ALLOWED = /^\.env\.(example|sample|template)$/;

function isSecret(p: string): boolean {
  const name = path.basename(p.replace(/["']/g, ''));
  if (ALLOWED.test(name)) return false;
  return /^\.env(\..+)?$/.test(name) || /\.(pem|key|p12|pfx)$/.test(name) || /^id_(rsa|ed25519|ecdsa)$/.test(name);
}

const input = readInput();
const t = input.tool_input ?? {};
const targets =
  input.tool_name === 'Bash'
    ? (t.command ?? '').split(/[\s|;&()<>=]+/).filter(Boolean)
    : [t.file_path, t.path, t.notebook_path].filter((p): p is string => Boolean(p));

const hit = targets.find(isSecret);
if (hit) {
  block(
    `🔒 [my-harness] 비밀 파일 접근을 차단했습니다: ${hit}\n` +
      `- 환경변수는 이름만 다룹니다. 이름은 .env.example 이나 병원 정의서에서 확인하세요.\n` +
      `- 값이 꼭 필요한 작업이면 직접 하지 말고 사용자에게 해달라고 요청하세요.`,
  );
}
