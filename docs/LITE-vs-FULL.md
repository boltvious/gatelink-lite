# gatelink-lite vs gatelink (full)

## Lite (public-safe) — repo ini

- 5 tools: read_file, search_files, search_code, get_workspace_info, list_tools
- Read-only, path guard, max file 500KB
- No terminal, no write, no browser automation
- Cocok untuk: demo, portfolio, Zyte application, marketplace preview

## Full (private — TIDAK di repo ini)

- Semua tools lite +
- write_file, edit_file, diff_file
- execute_command, run_in_terminal, terminal_session, terminal background
- desktop_capture, attach_file
- Browser automation (click, type, navigate, screenshot)
- Guard lengkap: ghost_call_guard, nonce_guard, param_guard, regex_guard, path_guard, binary_detect

## Rule

Jangan pernah copy tool write/terminal dari full ke lite.
Lite harus tetap bisa di-public tanpa risiko.

## Test

```powershell
cd D:\gatelink-lite
node --test test/lite.test.js
```

Expected: 8 tests pass — 5 tools jalan, write/execute blocked, path traversal blocked.
