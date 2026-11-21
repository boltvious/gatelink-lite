/**
 * gatelink-lite — Direct API Example (NO FRAMEWORK)
 *
 * Bukti kalau kamu ngerti dalemnya, bukan cuma bisa panggil LangChain.
 *
 * Yang dibuktikan file ini:
 *  1. MCP itu cuma JSON-RPC via stdio: { jsonrpc, id, method, params } + \n
 *  2. Agent loop itu cuma: kirim messages + tools -> model balas tool_calls -> panggil MCP -> balik lagi
 *  3. Ganti provider tinggal ganti BASE_URL + API_KEY, kodenya sama
 *
 * 0 dependency. Cuma Node >=22 (fetch + child_process bawaan).
 *
 * Cara pakai:
   # provider gratis, sama kayak myclaude
 *   set NVIDIA_API_KEY=nvapi-xxx
 *   node examples/direct_api.js "cari semua TODO di project ini"
 *
 *   # OpenAI
 *   set OPENAI_API_KEY=sk-xxx
 *   node examples/direct_api.js "baca README dan rangkum"
 *
 *   # Ollama lokal (tanpa key)
 *   set BASE_URL=http://localhost:11434/v1
 *   set MODEL=qwen2.5-coder:7b
 *   node examples/direct_api.js "list file apa aja di sini"
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

// --- Config: provider-agnostic, kayak myclaude ---
const BASE_URL = process.env.BASE_URL || 'https://integrate.api.nvidia.com/v1';
const API_KEY = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || process.env.MYCLAUDE_API_KEY || process.env.PROVIDER_API_KEY || '';
const MODEL = process.env.MODEL || 'nvi' + 'dia/nemotron-3-ultra-550b-a55b';
const WORKSPACE = process.env.GATELINK_LITE_WORKSPACE || process.cwd();
const QUESTION = process.argv.slice(2).join(' ') || 'List file apa aja di workspace ini, terus baca README.md dan rangkum.';

if (!API_KEY && !BASE_URL.includes('localhost') && !BASE_URL.includes('127.0.0.1')) {
  console.error('Set NVIDIA_API_KEY / OPENAI_API_KEY dulu. Atau BASE_URL ke Ollama lokal.');
  process.exit(1);
}

// --- MCP client: ini doang, nggak perlu library ---
class MCPClient {
  constructor() {
    this.proc = spawn('node', [path.join(__dirname, '..', 'mcp-server.cjs')], {
      env: { ...process.env, GATELINK_LITE_WORKSPACE: WORKSPACE },
    });
    this.buf = '';
    this.nextId = 1;
    this.pending = new Map();
    this.proc.stdout.setEncoding('utf8');
    this.proc.stdout.on('data', (c) => {
      this.buf += c;
      let i;
      while ((i = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, i).trim();
        this.buf = this.buf.slice(i + 1);
        if (!line) continue;
        const res = JSON.parse(line);
        if (this.pending.has(res.id)) { this.pending.get(res.id)(res); this.pending.delete(res.id); }
      }
    });
    this.proc.stderr.on('data', (d) => process.stderr.write('[mcp] ' + d));
  }
  request(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }
  async listTools() {
    await this.request('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'gatelink-lite-direct', version: '0.1.0' } });
    const res = await this.request('tools/list');
    return res.result.tools;
  }
  async callTool(name, args) {
    const res = await this.request('tools/call', { name, arguments: args });
    if (res.error) throw new Error(res.error.message);
    return res.result.content.map(c => c.text).join('\n');
  }
  close() { this.proc.kill(); }
}

// --- Agent loop: ini inti LangChain, tapi ditulis manual biar keliatan ---
async function main() {
  const mcp = new MCPClient();
  console.log('[1] Workspace:', WORKSPACE);
  console.log('[2] Model:', MODEL, '| Base:', BASE_URL);

  // Step 1: tanya MCP tool apa aja yang ada
  const mcpTools = await mcp.listTools();
  console.log('[3] MCP tools:', mcpTools.map(t => t.name).join(', '));

  // Step 2: convert MCP schema -> OpenAI tools schema (ini yang biasanya disembunyiin framework)
  const openAITools = mcpTools.map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.inputSchema },
  }));

  const messages = [
    { role: 'system', content: 'Kamu agent yang bisa baca workspace lewat tools. Kalau butuh file, panggil tool. Jangan mengarang isi file.' },
    { role: 'user', content: QUESTION },
  ];

  // Step 3: loop sampai model berhenti manggil tool (max 10 langkah, biar nggak infinite)
  for (let step = 0; step < 10; step++) {
    console.log(`\n--- Step ${step + 1}: kirim ke model ---`);
    const res = await fetch(BASE_URL + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + API_KEY },
      body: JSON.stringify({ model: MODEL, messages, tools: openAITools, tool_choice: 'auto', temperature: 0.2 }),
    });
    if (!res.ok) throw new Error('LLM error ' + res.status + ': ' + (await res.text()).slice(0, 500));
    const data = await res.json();
    const msg = data.choices[0].message;
    messages.push(msg);

    // Kalau model nggak manggil tool lagi = selesai
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      console.log('\n=== JAWABAN AKHIR ===\n' + msg.content);
      break;
    }

    // Kalau model manggil tool -> eksekusi beneran via MCP, hasilnya balik ke model
    for (const tc of msg.tool_calls) {
      const args = JSON.parse(tc.function.arguments || '{}');
      console.log(`[tool] ${tc.function.name}(${JSON.stringify(args)})`);
      const result = await mcp.callTool(tc.function.name, args);
      console.log('[tool result] ' + result.slice(0, 400));
      messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
    }
  }
  mcp.close();
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });