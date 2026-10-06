// install.sh 에서 실행: bun merge-settings.ts <target settings.local.json> <settings.harness.json> [profile.json]
// 기존 개인 설정은 유지하고, 이전에 설치한 하네스 훅만 새 것으로 교체한다. 권한 규칙은 합친다.
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
type Permissions = Partial<Record<'allow' | 'ask' | 'deny', string[]>>;
interface Settings {
  hooks?: HooksConfig;
  permissions?: Permissions;
  [key: string]: unknown;
}

const [target, source, profilePath] = process.argv.slice(2);
if (!target || !source) {
  console.error('usage: bun merge-settings.ts <target> <source> [profile.json]');
  process.exit(2);
}

const readJson = <T>(p: string | undefined, fallback: T): T =>
  p && fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf8')) as T) : fallback;

const settings = readJson<Settings>(target, {});
const harness = readJson<{ hooks: HooksConfig; permissions?: Permissions }>(source, { hooks: {} });
const profile = readJson<{ permissions?: Permissions }>(profilePath, {});

const isOurs = (group: MatcherGroup) => (group.hooks ?? []).some((h) => h.command?.includes('.my-harness/hooks/'));
const hooks: HooksConfig = settings.hooks ?? {};
for (const [event, groups] of Object.entries(harness.hooks)) {
  hooks[event] = (hooks[event] ?? []).filter((g) => !isOurs(g)).concat(groups);
}
settings.hooks = hooks;

const permissions = settings.permissions ?? {};
for (const kind of ['allow', 'ask', 'deny'] as const) {
  const rules = [...(permissions[kind] ?? []), ...(harness.permissions?.[kind] ?? []), ...(profile.permissions?.[kind] ?? [])];
  if (rules.length) permissions[kind] = [...new Set(rules)];
}
if (Object.keys(permissions).length) settings.permissions = permissions;

fs.writeFileSync(target, JSON.stringify(settings, null, 2) + '\n');
