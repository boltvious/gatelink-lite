const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const WORKSPACE = path.join(__dirname, '..', 'test-workspace');
let proc; let buf = ''; let nextId = 1; const pending = new Map();

function call(req) {
  return new Promise((resolve) => {
    pending.set(req.id, resolve);
    proc.stdin.write(JSON.stringify(req) + '\n');
  });
}

before(() => {
  fs.mkdirSync(WORKSPACE, { recursive: true });
  fs.writeFileSync(path.join(WORKSPACE, 'hello.txt'), 'hello gatelink-lite\nsecond line');
  fs.writeFileSync(path.join(WORKSPACE, 'app.js'), 'const x = 1; // TODO fix');
  proc = spawn('node', [path.join(__dirname, '..', 'mcp-server.cjs')], { env: { ...process.env, GATELINK_LITE_WORKSPACE: WORKSPACE } });
  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', (c) => {
    buf += c;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!line) continue;
      const res = JSON.parse(line);
      if (pending.has(res.id)) { pending.get(res.id)(res); pending.delete(res.id); }
    }
  });
});

after(() => { proc.kill(); fs.rmSync(WORKSPACE, { recursive: true, force: true }); });

test('tools/list returns exactly 5 read-only tools', async () => {
  const res = await call({ jsonrpc: '2.0', id: nextId++, method: 'tools/list' });
  const names = res.result.tools.map(t => t.name).sort();
  assert.deepEqual(names, ['get_workspace_info', 'list_tools', 'read_file', 'search_code', 'search_files']);
});

test('read_file works', async () => {
  const res = await call({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name: 'read_file', arguments: { path: 'hello.txt' } } });
  assert.match(res.result.content[0].text, /hello gatelink-lite/);
});

test('search_files works', async () => {
  const res = await call({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name: 'search_files', arguments: { query: 'app' } } });
  assert.match(res.result.content[0].text, /app\.js/);
});

test('search_code works', async () => {
  const res = await call({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name: 'search_code', arguments: { query: 'TODO' } } });
  assert.match(res.result.content[0].text, /TODO/);
});

test('get_workspace_info works', async () => {
  const res = await call({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name: 'get_workspace_info', arguments: {} } });
  assert.match(res.result.content[0].text, /hello\.txt/);
});

test('write_file is BLOCKED in lite', async () => {
  const res = await call({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name: 'write_file', arguments: { path: 'evil.txt', content: 'x' } } });
  assert.ok(res.error, 'write_file must error in lite');
  assert.match(res.error.message, /blocked/i);
});

test('execute_command is BLOCKED in lite', async () => {
  const res = await call({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name: 'execute_command', arguments: { command: 'whoami' } } });
  assert.ok(res.error);
});

test('path traversal is BLOCKED', async () => {
  const res = await call({ jsonrpc: '2.0', id: nextId++, method: 'tools/call', params: { name: 'read_file', arguments: { path: '../secret.txt' } } });
  assert.ok(res.error);
});
