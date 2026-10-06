// SessionStart: 설치된 프로필이 이 레포와 맞는지 확인한다. 안 맞으면 지도가 틀린 사실을 주입하므로 알린다.
import fs from 'node:fs';
import path from 'node:path';
import { readInput, projectDir, git, output, loadProfile } from './lib.ts';

const root = projectDir(readInput());
const profile = loadProfile();

const problems: string[] = [];
if (!profile) problems.push('프로필이 설치되지 않았습니다. 원본에서 `install.sh --profile <이름>` 으로 다시 설치하세요.');
else {
  const missing = (profile.expects ?? []).filter((p) => !fs.existsSync(path.join(root, p)));
  if (missing.length) problems.push(`프로필 "${profile.name}" 이 기대하는 경로가 없습니다 (${missing.join(', ')}). 다른 레포용일 수 있습니다.`);
  if (profile.teamBaseline && git(root, ['cat-file', '-e', `${profile.teamBaseline}^{commit}`]) === null)
    problems.push(`팀 기준 커밋 ${profile.teamBaseline} 이 이 레포에 없어 팀 문서 변경을 추적하지 못합니다.`);
}
if (!problems.length) process.exit(0);

const list = problems.map((p) => `- ${p}`).join('\n');
output({
  systemMessage: `⚠️ [my-harness] 프로필 점검:\n${list}`,
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: `[my-harness] 하네스 프로필이 이 레포와 어긋난다:\n${list}\n프로필 지도의 사실관계는 레포에서 직접 확인한다.`,
  },
});
