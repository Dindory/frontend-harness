// PostToolUse: 수정된 파일에 프로젝트 포매터(Biome / Prettier)를 실행한다.
// 프로젝트에 설정과 로컬 설치가 모두 있을 때만 동작하고, 실패해도 작업을 막지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readInput, projectDir } from './lib.ts';

const EXT = /\.(tsx?|jsx?|mjs|cjs|css|json|md)$/;
const BIOME = ['biome.json', 'biome.jsonc'];
const PRETTIER = [
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.js',
  '.prettierrc.mjs',
  '.prettierrc.yaml',
  'prettier.config.js',
  'prettier.config.mjs',
];

const input = readInput();
const file = input.tool_input?.file_path;
if (!file || !EXT.test(file) || !fs.existsSync(file)) process.exit(0);

// 파일 위치부터 프로젝트 루트까지 올라가며 설정·바이너리를 찾는다 (apps/<site> 별 설정 지원)
const root = path.resolve(projectDir(input));
const dirsUp: string[] = [];
for (let d = path.dirname(path.resolve(file)); d.startsWith(root); d = path.dirname(d)) {
  dirsUp.push(d);
  if (d === root) break;
}

const has = (names: string[]) => dirsUp.some((d) => names.some((n) => fs.existsSync(path.join(d, n))));
const findBin = (name: string) =>
  dirsUp.map((d) => path.join(d, 'node_modules', '.bin', name)).find((p) => fs.existsSync(p));

const biome = has(BIOME) ? findBin('biome') : undefined;
const prettier = has(PRETTIER) ? findBin('prettier') : undefined;

if (biome) spawnSync(biome, ['format', '--write', file], { cwd: root, stdio: 'ignore', timeout: 20_000 });
else if (prettier) spawnSync(prettier, ['--write', '--log-level', 'warn', file], { cwd: root, stdio: 'ignore', timeout: 20_000 });
