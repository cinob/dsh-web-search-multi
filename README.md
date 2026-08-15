# dsh-web-search-multi

> Multi-provider web search plugin for **DeepSeek Harness (DSH)** supporting free-tier providers (Bing, Baidu, Tavily, Brave, Serper, Bocha, SearXNG, DuckDuckGo) with auto-fallback and Web Settings UI.

English | [简体中文](README.zh.md)

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-cinob%2Fdsh--web--search--multi-181717?logo=github)](https://github.com/cinob/dsh-web-search-multi)
[![dsh-plugin](https://img.shields.io/badge/DSH-Plugin-green)](https://github.com/AdamPlatin123/awesome-dsh-plugins)

---

## 1. Overview

`dsh-web-search-multi` connects DeepSeek Harness to multiple search engines with automated fault tolerance:
- **Free Zero-Key Engines**: Bing (RSS structured + HTML parsing) and Baidu direct search without any API keys.
- **AI-Native Free Tiers**: Tavily (1,000/mo), Brave Search (2,000/mo), Serper/Google (2,500 free), Bocha AI.
- **Private & Self-Hosted**: SearXNG with token authentication.
- **Global Fallback**: DuckDuckGo.
- **Web GUI Control**: Full graphical settings tab inside DSH Web UI (`Settings` -> `Web Search`) with live connection testing and instant persistence.

---

## 2. Compatibility

- **Node.js**: `>= 20.0.0`
- **DeepSeek Harness**: Verified on mainline `v0.1.0+`
- **Platform**: Linux / macOS / Windows

---

## 3. Install & Uninstall

### Direct Installation from GitHub (Recommended)
```bash
dsh plugin --profile web add github:cinob/dsh-web-search-multi
```

### Or via Git HTTPS Spec
```bash
dsh plugin --profile web add git+https://github.com/cinob/dsh-web-search-multi.git
```

### Or Local Clone
```bash
git clone https://github.com/cinob/dsh-web-search-multi.git
dsh plugin --profile web add ./dsh-web-search-multi
```

### Uninstall
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
4. (Optional) Enter your API keys for Tavily, Brave, Serper, or Bocha.

---

## 5. Configuration

### Environment Variables
| Variable | Description |
|---|---|
| `DSH_WEB_SEARCH_PROVIDER` | Set to `multi-search` |
| `TAVILY_API_KEY` | Tavily API Key (1,000 searches/mo) |
| `BRAVE_API_KEY` | Brave Search API Key (2,000 searches/mo) |
| `SERPER_API_KEY` | Serper Google API Key (2,500 searches) |
| `BOCHA_API_KEY` | Bocha AI Search API Key |
| `SEARXNG_URL` | SearXNG instance URL (e.g. `http://localhost:8888`) |
| `SEARXNG_TOKEN` | SearXNG access token (optional) |

### Profile Patch (`cordis.patch.yml`)
```yaml
- insert:
    - id: web-search-multi
      name: dsh-web-search-multi
      config:
        provider: auto
        enableFallback: true

- id: web
  name: '@deepseek-ai/dsh-web'
  config:
    searchProvider: multi-search
```

---

## 6. Permissions & Data Disclosures

- **Risk Level**: `low`
- **Network**: Outbound HTTPS requests to selected search providers.
- **Filesystem**: Reads/writes local persistent configuration under `~/.dsh/web-search-multi.json`.
- **Credentials**: API keys are saved strictly to your local configuration document.

---

## 7. Troubleshooting

- **DuckDuckGo `fetch failed`**: In mainland China, DuckDuckGo requires a network proxy (`HTTP_PROXY`). Switch to `Bing` or `Baidu` for zero-proxy direct access.
- **Config not applied**: Restart `dsh web` after modifying `cordis.patch.yml` or adding the plugin.

---

## 8. Development

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

## 9. License

MIT License.
- Repository: [https://github.com/cinob/dsh-web-search-multi](https://github.com/cinob/dsh-web-search-multi)
- Issue Tracker: [https://github.com/cinob/dsh-web-search-multi/issues](https://github.com/cinob/dsh-web-search-multi/issues)
