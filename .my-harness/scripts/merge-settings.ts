// install.sh 에서 실행: bun merge-settings.ts <target settings.local.json> <settings.hooks.json>
// 기존 개인 설정은 유지하고, 이전에 설치한 하네스 훅만 새 것으로 교체한다.
import fs from 'node:fs';

interface HookCommand {
  type: string;
  command?: string;
}
interface MatcherGroup {
  matcher?: string;
  hooks?: HookCommand[];
}
type HooksConfig = Record<string, MatcherGroup[]>;
interface Settings {
  hooks?: HooksConfig;
  [key: string]: unknown;
}

const [target, source] = process.argv.slice(2);
if (!target || !source) {
  console.error('usage: bun merge-settings.ts <target> <source>');
  process.exit(2);
}

const settings: Settings = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : {};
const ours: HooksConfig = JSON.parse(fs.readFileSync(source, 'utf8')).hooks;
const isOurs = (group: MatcherGroup) => (group.hooks ?? []).some((h) => h.command?.includes('.my-harness/hooks/'));

const hooks: HooksConfig = settings.hooks ?? {};
for (const [event, groups] of Object.entries(ours)) {
  hooks[event] = (hooks[event] ?? []).filter((g) => !isOurs(g)).concat(groups);
}
settings.hooks = hooks;

fs.writeFileSync(target, JSON.stringify(settings, null, 2) + '\n');
