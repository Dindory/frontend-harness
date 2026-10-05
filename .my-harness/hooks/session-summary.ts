// Stop: 응답이 끝날 때 작업 트리의 변경 파일 목록을 사용자에게 보여준다.
import { readInput, projectDir, git, output } from './lib.ts';

const MAX = 20;

const input = readInput();
const status = git(projectDir(input), ['status', '--short', '--untracked-files=all']);
if (!status) process.exit(0);

const lines = status.split('\n');
const more = lines.length > MAX ? `\n… 외 ${lines.length - MAX}개` : '';
output({ systemMessage: `📝 변경된 파일 ${lines.length}개\n${lines.slice(0, MAX).join('\n')}${more}` });
