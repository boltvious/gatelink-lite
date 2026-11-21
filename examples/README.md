# examples — Tanpa Framework Dulu

> Kalau copot framework-nya, kodenya masih jalan nggak?
> Kalau jawabannya iya, berarti ngerti dalemnya. Kalau tidak, berarti cuma bisa pakai framework.

Itu tes yang dipakai di sini.

## Kenapa Tanpa Framework Dulu?

Framework agent itu menyembunyikan 3 hal ini:

1. MCP itu cuma JSON-RPC via stdio: `{ jsonrpc, id, method, params }` + newline
2. Convert schema MCP -> schema tools model
3. Agent loop: kirim messages + tools -> model balas tool_calls -> panggil tool beneran -> balikin hasilnya ke model -> ulang sampai selesai

Kalau 3 hal itu ditulis manual sekali, pakai framework apapun jadi gampang.
Kalau langsung pakai framework tanpa pernah nulis manual, begitu framework update / error / tidak support versi MCP baru, langsung lumpuh.

## File di Folder Ini

### `direct_api.js` — 0 dependency, 0 framework

Bukti tanpa framework. Cuma pakai `fetch` + `child_process` bawaan Node 22.

Isinya:
- `MCPClient` — spawn `mcp-server.cjs`, kirim `initialize`, `tools/list`, `tools/call`
- Convert `mcpTools` -> `openAITools` (format tools untuk model)
- Agent loop manual, max 10 langkah biar tidak infinite
- Provider-agnostic: ganti `BASE_URL` + `API_KEY` + `MODEL`, kodenya sama

### Cara Pakai

```powershell
# 1. Set key di terminal kamu sendiri, JANGAN paste di chat / di video
$env:PROVIDER_API_KEY="xxx-kamu"
$env:GATELINK_LITE_WORKSPACE="D:\gatelink-lite"

# 2. Jalanin
node examples/direct_api.js "cari semua TODO di project ini"
```

```powershell
# Tanpa key, pakai model lokal (Ollama)
$env:BASE_URL="http://localhost:11434/v1"
$env:MODEL="qwen2.5-coder:7b"
$env:GATELINK_LITE_WORKSPACE="D:\gatelink-lite"
node examples/direct_api.js "baca README dan rangkum"
```

### Yang Harus Keliatan di Record / Demo

```
[1] Workspace: D:\gatelink-lite
[2] Model: ... | Base: ...
[3] MCP tools: read_file, search_files, search_code, get_workspace_info, list_tools
--- Step 1: kirim ke model ---
[tool] search_code({"query":"TODO"})
[tool result] app.js:12: // TODO fix
--- Step 2: kirim ke model ---
=== JAWABAN AKHIR ===
...
```

Kalau log-nya kayak gitu, berarti:
- MCP jalan
- Tool-call jalan
- Agent loop jalan
- Bukan mengarang jawaban

### Tips Record

- Set key DULU, baru mulai record. Jangan rekam saat ngetik key.
- Pakai workspace kecil (misal `gatelink-lite` sendiri) biar `search_code` cepat.
- Kalau mau 100% tanpa key, pakai model lokal.

## Nanti: Versi Framework (Pembanding)

Setelah yang manual ini beres, baru bikin versi framework sebagai pembanding:

- `framework_agent.py` — versi framework, 30 baris vs 150 baris manual, dalemnya sama
- Tujuannya bukan ganti yang manual, tapi nunjukin: "aku bisa manual, dan aku juga bisa pakai framework kalau timnya pakai itu."

Itu jawaban senior.
