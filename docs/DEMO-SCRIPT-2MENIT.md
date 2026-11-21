# Demo Script — gatelink-lite (2 Menit)

> Target: buktikan agent tanpa framework bisa baca workspace lewat MCP, pakai API key beneran.
> Total: ~120 detik. Jangan lebih, CEO / hiring nggak nonton yang kepanjangan.

## Setup Sebelum Record (OFF-CAMERA, jangan direkam)

```powershell
$env:NVIDIA_API_KEY="isi-key-kamu"
$env:GATELINK_LITE_WORKSPACE="D:\gatelink-lite"
```

- Set key DULU, baru mulai record. Jangan rekam saat ngetik key.
- Tutup tab yang ada key / token.
- Workspace pakai `D:\gatelink-lite` biar cepat, jangan workspace gede.

## 0:00 - 0:15 — Hook (15 detik)

> Ngomong sambil layar nunjukin folder `gatelink-lite`:

"Ini gatelink-lite. AI bisa baca workspace lokal saya, tapi read-only — nggak bisa nulis, nggak bisa jalanin terminal. Dan ini tanpa framework, 0 dependency. Saya buktiin sekarang pakai API key beneran."

## 0:15 - 0:25 — Tunjukin Isi Project (10 detik)

Ketik (atau sudah dibuka):

```powershell
dir D:\gatelink-lite
```

Sebutin cepat:
"Isinya: mcp-server.cjs, examples/direct_api.js, test 8 test, docs."

## 0:25 - 1:30 — Gas Demo (65 detik, INTI)

Jalanin SATU perintah ini (ini yang tadi SAH):

```powershell
node D:\gatelink-lite\examples\direct_api.js "cari semua TODO di project ini, terus rangkum file apa aja yang ada"
```

Diemin jalan, biar penonton liat log-nya jalan sendiri. Yang harus keliatan:

```
[1] Workspace: D:\gatelink-lite
[2] Model: nvidia/nemotron-3-ultra-550b-a55b
[3] MCP tools: read_file, search_files, search_code, get_workspace_info, list_tools
--- Step 1 ---
[tool] get_workspace_info
[tool] search_code TODO
--- Step 2 ---
[tool] read_file docs -> [dir] docs / LITE-vs-FULL.md
[tool] read_file package.json
--- Step 3 ---
[tool] read_file mcp-server.cjs / README.md / docs/LITE-vs-FULL.md
--- Step 4 ---
=== JAWABAN AKHIR ===
TODO ada di 3 file, semua contoh/test data
Struktur project + 5 tools + security
```

Sambil nunggu Step 1-3 (ultra agak lambat ~30 detik), ngomong 1 kalimat aja:
"Ini agent loop manual — kirim ke model, model minta tool, kita panggil MCP beneran, balikin ke model, ulang sampai selesai."

JANGAN potong videonya di tengah Step. Biarin keliatan nunggu, itu bukti bukan editan.

## 1:30 - 1:50 — Tunjukin Test (20 detik)

```powershell
node --test test/lite.test.js
```

Sebutin:
"8 dari 8 test pass — 5 tools jalan, write_file ke-block, execute_command ke-block, path traversal ke-block."

## 1:50 - 2:00 — Closing (10 detik)

> Layar balik ke README / folder:

"Lite ini yang boleh di-share. Versi full-nya private — ada write, terminal, browser automation. Kalau mau liat full / collab, DM saya."

Selesai. Stop record.

## Checklist Sebelum Upload

- [ ] Key TIDAK keliatan di video manapun (cek frame awal)
- [ ] Log `=== JAWABAN AKHIR ===` keliatan utuh
- [ ] Durasi 1:45 - 2:15, jangan lebih
- [ ] Judul video: `gatelink-lite — Web AI baca workspace lokal, tanpa framework, read-only`
- [ ] Deskripsi: link GitHub repo lite + "Full version private"

## Kalau Gagal Pas Record

- `410 Gone` -> model pensiun, ganti `$env:MODEL` ke model lain yang masih hidup
- `KOSONG / Set API_KEY dulu` -> key belum ke-set di jendela yang sama, set ulang di jendela itu
- `ERROR: Not a file` -> sudah di-fix di v0.1.1, pastikan pakai file terbaru
- Model lama jawab -> jangan diulang-ulang, 1x take yang bagus lebih meyakinkan dari 5x take editan
