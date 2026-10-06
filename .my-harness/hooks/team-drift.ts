// SessionStart: 프로필의 기준 커밋(teamBaseline) 이후 팀 문서가 바뀌었으면 알린다.
// 바뀌었다면 프로필 AGENTS.md 의 🟡임시 항목이 팀 결정과 어긋났을 수 있다.
import { readInput, projectDir, git, output, loadProfile } from './lib.ts';

const input = readInput();
const root = projectDir(input);
const profile = loadProfile();
const baseline = profile?.teamBaseline ?? '';
const watched = profile?.teamDocs ?? [];

if (!baseline || !watched.length || git(root, ['cat-file', '-e', `${baseline}^{commit}`]) === null) process.exit(0);

// 로컬(pull 받은 것)과 원격(fetch 만 한 것) 양쪽을 본다
const refs = ['HEAD', 'origin/HEAD'].filter((r) => git(root, ['rev-parse', '--verify', '-q', r]));
const files = [
  ...new Set(
    refs.flatMap((r) =>
      (git(root, ['diff', '--name-only', baseline, r, '--', ...watched]) ?? '').split('\n').filter(Boolean),
    ),
  ),
];
if (!files.length) process.exit(0);

const list = files.slice(0, 15).map((f) => `- ${f}`).join('\n');
output({
  systemMessage: `⚠️ [my-harness] 하네스 기준(${baseline}) 이후 팀 문서 ${files.length}개가 바뀌었습니다. 🟡임시 규칙을 다시 확인하세요.`,
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext:
      `[my-harness] 하네스 기준 커밋 ${baseline} 이후 팀 문서가 바뀌었다 (${refs.join(', ')} 기준):\n${list}\n` +
      `작업 전에 바뀐 문서를 읽고, .my-harness/profile/AGENTS.md 의 🟡임시 항목과 충돌하면 팀 문서를 따르고 사용자에게 알린다.`,
  },
});
