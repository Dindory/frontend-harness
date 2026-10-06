// UserPromptSubmit: 턴이 시작될 때 입력을 검사해 관련 문서와 활성 요청서를 Claude 에게 알린다.
// 문서를 읽는 건 Claude 다. 여기서는 경로와 이유만 넘겨 매 턴 토큰을 아낀다.
import fs from 'node:fs';
import path from 'node:path';
import { readInput, projectDir, output } from './lib.ts';

interface Rule {
  id: string;
  keywords: string[];
  docs: { path: string; why: string }[];
}
interface ContextMap {
  screenWork: string[];
  rules: Rule[];
}

const MAX_DOCS = 6;

const input = readInput();
const prompt = (input.prompt ?? '').toLowerCase();
// 슬래시 명령/빈 입력은 건너뛴다 (스킬이 자체 절차를 가진다)
if (!prompt.trim()) process.exit(0);

const root = projectDir(input);
const harness = path.join(import.meta.dirname, '..');

let map: ContextMap;
try {
  map = JSON.parse(fs.readFileSync(path.join(harness, 'context-map.json'), 'utf8'));
} catch {
  process.exit(0);
}

const hit = (words: string[]) => words.some((w) => prompt.includes(w.toLowerCase()));

// 1) 키워드 → 문서 (프로젝트에 실제로 있는 문서만)
const docs = new Map<string, string>();
for (const rule of map.rules) {
  if (!hit(rule.keywords)) continue;
  for (const d of rule.docs) {
    if (fs.existsSync(path.join(root, d.path)) && !docs.has(d.path)) docs.set(d.path, d.why);
  }
}

// 2) 활성 요청서: 가장 최근 것 중 '보고' 항목이 아직 체크되지 않은 것
const tasksDir = path.join(harness, 'tasks');
let activeTask: string | null = null;
if (fs.existsSync(tasksDir)) {
  const files = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.md')).sort().reverse();
  for (const f of files) {
    const body = fs.readFileSync(path.join(tasksDir, f), 'utf8');
    if (!/^- \[x\] 보고/m.test(body)) {
      activeTask = `.my-harness/tasks/${f}`;
      break;
    }
  }
}

const lines: string[] = [];
if (activeTask) lines.push(`활성 요청서: ${activeTask} — 이 작업의 정본이다. 진행 기록·결정 로그를 여기에 갱신한다.`);
else if (hit(map.screenWork))
  lines.push('활성 요청서 없음. 화면 작업으로 보인다: 요청서의 ★ 항목 중 빠진 것을 먼저 묻는다 (`new-task.sh`).');
if (docs.size) {
  lines.push('이번 요청과 관련된 문서 (작업 전에 읽는다):');
  for (const [p, why] of [...docs].slice(0, MAX_DOCS)) lines.push(`- ${p} — ${why}`);
}
if (!lines.length) process.exit(0);

output({
  hookSpecificOutput: {
    hookEventName: 'UserPromptSubmit',
    additionalContext: `[my-harness] 턴 시작 점검\n${lines.join('\n')}`,
  },
});
