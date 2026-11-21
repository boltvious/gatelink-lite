# gatelink-lite

Connect web AI assistants to your local VS Code workspace — **read-only, safe to share**.

> Lite = AI can READ your workspace, but CANNOT write, edit, run commands, or open terminal.
> Full `gatelink` is private. This is the public-safe slice.

[[Node >= 18](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org) [[MCP Compatible](https://img.shields.io/badge/MCP-compatible-blue)](https://modelcontextprotocol.io) [[Tests](https://img.shields.io/badge/tests-8%2F8%20passing-brightgreen)](#verified--evidence-over-claims) [[License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [[Zero Framework](https://img.shields.io/badge/framework-none-lightgrey)](#option-b--no-framework-direct-api-for-hiring-review)

## Demo — 2 min

🎥 **Watch the demo:** https://youtu.be/L4ApGAjRRfk

> Demo shows: start gateway in VS Code → open ChatGPT / Claude / Gemini → `/gatelink-lite` → AI reads real files from local workspace, no copy-paste.

## What Lite Can Do (5 tools only)

| Tool | What it does |
| --- | --- |
| `read_file` | Read file content |
| `search_files` | Find files by name / glob pattern |
| `search_code` | Search text inside files |
| `get_workspace_info` | List workspace structure |
| `list_tools` | List available tools |

## What Lite CANNOT Do (kept in full version)

- ❌ `write_file`, `edit_file`, `diff_file`
- ❌ `execute_command`, `run_in_terminal`, `terminal_session`
- ❌ `desktop_capture`, `attach_file`
- ❌ Browser automation (click, type, navigate)

That is intentional. Lite is for **reading**, not for giving AI control of your machine.

## Quick Start

### Option A — MCP Server (VS Code Extension Host)

```bash
cd D:\gatelink-lite
npm install
npm test
```

1. Open `gatelink-lite/gateway-vscode` in VS Code, press `F5`
2. Open your workspace in Extension Development Host
3. Click `gatelink-lite: off` → Start gateway
4. Open AI chat (ChatGPT / Claude / Gemini / DeepSeek)
5. Type `/gatelink-lite` and confirm

### Option B — No Framework, Direct API (for hiring review)

No LangChain. No LlamaIndex. Just plain Node + `fetch`:

```bash
cd D:\gatelink-lite\examples
node direct_api.js "Find all TODOs in this project"
```

See [`examples/README.md`](examples/README.md) — built this way on purpose so a reviewer can verify the code really works without hiding behind a framework.

What this proves:
1. MCP is just JSON-RPC via stdio
2. An agent loop is just: send `messages + tools` → model returns `tool_calls` → execute via MCP → send result back
3. Switching providers is just: change `BASE_URL` + `API_KEY` — the code stays the same

## Verified — Evidence Over Claims

- ✅ `npm test` → **8/8 tests pass** (`test/lite.test.js`)
- ✅ Live run with real API key → reached final answer with `nvidia/nemotron-3-ultra-550b-a55b`
- ✅ MCP server `v0.1.1` — fixed glob search + folder read
- ✅ `PROVIDER_API_KEY` supported in `examples/direct_api.js`

> No API keys are committed. See `.gitignore`.

## Project Structure

```
gatelink-lite/
├── README.md
├── package.json
├── mcp-server.cjs
├── mcp-config.example.json
├── test/lite.test.js
├── examples/direct_api.js
├── docs/
└── gateway-vscode/
```

## Lite vs Full

See [`docs/LITE-vs-FULL.md`](docs/LITE-vs-FULL.md)

|  | Lite (this repo) | Full (private) |
| --- | --- | --- |
| Read files | ✅ | ✅ |
| Search code | ✅ | ✅ |
| Write / edit files | ❌ | ✅ |
| Run commands / terminal | ❌ | ✅ |
| Desktop capture | ❌ | ✅ |
| Browser automation | ❌ | ✅ |

## Why This Exists

Built as a portfolio + hiring asset — e.g. **Zyte Integrations Engineer** — where the job is to connect real systems, handle real APIs, and prove it works with real data, not just slides.

## Related

- **kane-guard** — verifier that knows when to say no. Demo: https://youtu.be/Fnshh0MtSWU — https://github.com/boltvious/kane-guard

## License

MIT
