import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
const url = 'http://127.0.0.1:5173';
const root = new URL('..', import.meta.url);
const children = [];
const run = args => {const child=spawn('npm', args, {stdio:'inherit', cwd:root}); children.push(child); return child;};
const isUp = async endpoint => {try {return (await fetch(endpoint, {signal:AbortSignal.timeout(1500)})).ok;} catch {return false;}};
if (existsSync(new URL('../apps/proxy/.env',import.meta.url)) && !await isUp('http://127.0.0.1:7070/api/health')) run(['run','dev:proxy']);
const open = () => {if (process.platform === 'darwin') spawn('open', [url], {stdio:'ignore'});console.log(`Preview: ${url}`);};
if (await isUp(url)) open();
else {
  const server=run(['run','dev:web']);
  const timer=setInterval(async () => {if (await isUp(url)) {clearInterval(timer);open();}},500);
  server.on('exit', code => {clearInterval(timer);children.forEach(c=>c.kill());process.exit(code??0);});
}
process.on('SIGINT', () => {children.forEach(c=>c.kill('SIGINT'));process.exit(0);});
