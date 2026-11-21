#!/usr/bin/env node
/**
 * gatelink-lite - MCP Server (READ-ONLY) v0.1.2
 * Fix v0.1.2: ignore notifications (no id) — LangChain / Python MCP client
 *   used to crash on `notifications/initialized` because we replied with
 *   an error without an id. JSON-RPC: notifications MUST NOT get a response.
 * Fix v0.1.1: search_files ngerti glob, read_file ngerti folder
 * Tools: read_file, search_files, search_code, get_workspace_info, list_tools
 */
const fs = require('fs');
const path = require('path');
const WORKSPACE = process.env.GATELINK_LITE_WORKSPACE || process.cwd();
function resolveSafe(p) {
  const abs = path.resolve(WORKSPACE, p || '.');
  const root = path.resolve(WORKSPACE);
  if (abs !== root && !abs.startsWith(root + path.sep)) throw new Error('Path outside workspace blocked: ' + p);
  return abs;
}
function readFile(p) {
  const abs = resolveSafe(p);
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) {
    const entries = fs.readdirSync(abs);
    return '[dir] ' + p + '\n' + entries.join('\n') + '\nTip: pakai read_file ke file di dalamnya, bukan ke folder.';
  }
  if (!stat.isFile()) throw new Error('Not a file: ' + p);
  if (stat.size > 500000) throw new Error('File too large (>500KB) in lite');
  return fs.readFileSync(abs, 'utf8');
}
function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === '__pycache__') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out); else out.push(full);
  }
  return out;
}
function globToRegExp(q) {
  let s = '';
  for (let i = 0; i < q.length; i++) {
    const c = q[i];
    if (c === '*' && q[i+1] === '*') { s += '.*'; i++; if (q[i+1] === '/') i++; continue; }
    if (c === '*') { s += '[^/]*'; continue; }
    if (c === '?') { s += '.'; continue; }
    if ('.+^${}()|[]\\'.includes(c)) s += '\\' + c; else s += c;
  }
  return new RegExp('^' + s + '$', 'i');
}
function searchFiles(query) {
  const files = walk(path.resolve(WORKSPACE));
  const q = (query || '').trim();
  const rels = files.map(f => path.relative(WORKSPACE, f).split(path.sep).join('/'));
  if (q.includes('*') || q.includes('?')) {
    const rx = globToRegExp(q);
    const hit = rels.filter(r => rx.test(r));
    if (hit.length) return hit.slice(0, 100);
  }
  const lower = q.toLowerCase();
  const prefix = q.replace(/\/$/, '').toLowerCase();
  const byPrefix = rels.filter(r => r.toLowerCase().startsWith(prefix + '/'));
  if (byPrefix.length) return byPrefix.slice(0, 100);
  return rels.filter(r => r.toLowerCase().includes(lower)).slice(0, 100);
}
function searchCode(query) {
  const files = walk(path.resolve(WORKSPACE));
  const out = [];
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(esc, 'i');
  for (const f of files) {
    try {
      if (fs.statSync(f).size > 200000) continue;
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => { if (re.test(line)) out.push(path.relative(WORKSPACE, f) + ':' + (i+1) + ': ' + line.trim().slice(0, 200)); });
    } catch {}
    if (out.length >= 100) break;
  }
  return out;
}
function getWorkspaceInfo() {
  const root = path.resolve(WORKSPACE);
  return { workspaceRoot: root, valid: true, entries: fs.readdirSync(root) };
}
const TOOLS = [
  { name: 'read_file', description: 'Read file content. Kalau path-nya folder, dibalikin list isinya.', inputSchema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
  { name: 'search_files', description: 'Find files. Dukung substring (docs) dan glob (docs/**, **/*.js).', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'search_code', description: 'Search text inside files', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_workspace_info', description: 'List workspace structure', inputSchema: { type: 'object', properties: {} } },
  { name: 'list_tools', description: 'List available tools (lite = 5 read-only)', inputSchema: { type: 'object', properties: {} } },
];
function handle(req) {
  const { id, method, params = {} } = req;
  // FIX v0.1.2: notifications have no id -> MUST NOT reply.
  // LangChain sends `notifications/initialized` after initialize.
  // Old code replied with an error without id -> Python MCP parser crashed.
  if (id === undefined || id === null) return null;
  if (method === 'initialize') return { jsonrpc: '2.0', id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'gatelink-lite', version: '0.1.2' } } };
  if (method === 'tools/list') return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
  if (method === 'tools/call') {
    const name = params.name; const args = params.arguments || {};
    try {
      let text = '';
      if (name === 'read_file') text = readFile(args.path);
      else if (name === 'search_files') text = JSON.stringify(searchFiles(args.query), null, 2);
      else if (name === 'search_code') text = searchCode(args.query).join('\n') || '(no match)';
      else if (name === 'get_workspace_info') text = JSON.stringify(getWorkspaceInfo(), null, 2);
      else if (name === 'list_tools') text = JSON.stringify(TOOLS.map(t => t.name), null, 2);
      else return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Unknown or blocked tool in lite: ' + name } };
      return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } };
    } catch (e) { return { jsonrpc: '2.0', id, error: { code: -32603, message: String(e.message || e) } }; }
  }
  // Also ignore notifications that somehow carry an id-like shape but start with notifications/ or $/
  if (typeof method === 'string' && (method.startsWith('notifications/') || method.startsWith('$/'))) return null;
  return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } };
}
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
    if (!line) continue;
    try {
      const req = JSON.parse(line);
      const res = handle(req);
      if (res !== null && res !== undefined) process.stdout.write(JSON.stringify(res) + '\n');
    }
    catch (e) { process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: String(e.message || e) } }) + '\n'); }
  }
});
