# dsh-web-search-multi

> Multi-provider web search plugin for **DeepSeek Harness (DSH)** supporting free-tier providers (360, Bing, Baidu, Tavily, Brave, Serper, Bocha, SearXNG, DuckDuckGo) with auto-fallback and Web Settings UI.

English | [简体中文](README.zh.md)

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-cinob%2Fdsh--web--search--multi-181717?logo=github)](https://github.com/cinob/dsh-web-search-multi)
[![dsh-plugin](https://img.shields.io/badge/DSH-Plugin-green)](https://github.com/AdamPlatin123/awesome-dsh-plugins)

---

## 1. Overview

`dsh-web-search-multi` connects DeepSeek Harness to multiple search engines with automated fault tolerance:
- **Free Zero-Key Direct Engines**: 360 Search (real-time news and trending events), Bing, and Baidu direct search without any API keys.
- **AI-Native Free Tiers**: Tavily (1,000/mo), Brave Search (2,000/mo), Serper/Google (2,500 free), Bocha AI.
- **Private & Self-Hosted**: SearXNG with token authentication.
- **Global Fallback**: DuckDuckGo.
- **Web GUI Control**: Full graphical settings tab inside DSH Web UI (`Settings` -> `多源 Web 搜索`) with live connection testing and instant persistence.
- **Secure Credential Storage**: Secrets saved securely to `~/.dsh/.credentials.yaml` (mode 0600), non-secret settings saved to `~/.dsh/settings.yaml`.

---

## 2. Compatibility

- **Node.js**: `>= 20.0.0`
- **DeepSeek Harness**: Verified on mainline `v0.1.0+`
- **Platform**: Linux / macOS / Windows

---

## 3. Install

As a standard DSH Profile Bundle, installation is one simple command:

```bash
dsh plugin --profile web add github:cinob/dsh-web-search-multi
```

> **Note**: As a Profile Bundle, the plugin's built-in `cordis.patch.yml` automatically mounts and activates `multi-search`. There is **no need** to manually insert `web-search-multi` in `profiles/web/cordis.patch.yml`.

### Uninstallation

```bash
dsh plugin --profile web remove dsh-web-search-multi
```

---

## 4. Quick Start

1. Start DSH Web:
   ```bash
   dsh web
   ```
2. Open Web GUI (`http://127.0.0.1:3080`) -> Click **Settings** (Gear icon) -> Select **多源 Web 搜索** in the sidebar.
3. Choose your preferred search engine or leave it on **自动策略 (Auto)**.
4. (Optional) Enter your API keys for Tavily, Brave, Serper, Bocha, or SearXNG Token, click Save, and test in real time.

---

## 5. Configuration

### Credentials & Environment Mapping
| Key / Variable | Description |
|---|---|
| `TAVILY_API_KEY` | Tavily API Key (1,000 searches/mo) |
| `BRAVE_API_KEY` | Brave Search API Key (2,000 searches/mo) |
| `SERPER_API_KEY` | Serper Google API Key (2,500 searches) |
| `BOCHA_API_KEY` | Bocha AI Search API Key |
| `SEARXNG_URL` | SearXNG instance URL (e.g. `https://s.655443.xyz`) |
| `SEARXNG_TOKEN` | SearXNG access token (optional) |

---

## 6. Permissions & Data Disclosures

- **Risk Level**: `low`
- **Network**: Outbound HTTPS requests to selected search providers.
- **Credentials**: Secrets persist securely in `~/.dsh/.credentials.yaml` via `ctx.credentials`, general settings in `~/.dsh/settings.yaml`.

---

## 7. Development

```bash
# Clone repository
git clone https://github.com/cinob/dsh-web-search-multi.git
cd dsh-web-search-multi

# Build client and server bundles
npm run build

# Run unit tests
npm test
```

---

## 8. License

MIT License.
- Repository: [https://github.com/cinob/dsh-web-search-multi](https://github.com/cinob/dsh-web-search-multi)
