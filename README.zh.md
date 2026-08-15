# dsh-web-search-multi

> 多源聚合与免费额度 Web 搜索插件（附带 Web GUI 可视化管理面板），适用于 **DeepSeek Harness (DSH)**。

[English](README.md) | 简体中文

[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-cinob%2Fdsh--web--search--multi-181717?logo=github)](https://github.com/cinob/dsh-web-search-multi)
[![dsh-plugin](https://img.shields.io/badge/DSH-Plugin-green)](https://github.com/AdamPlatin123/awesome-dsh-plugins)

---

## 1. 概述 (Overview)

`dsh-web-search-multi` 为 DeepSeek Harness 提供了全能的多源 Web 搜索支持与自动故障降级能力：
- **免 Key 极速直连**：内置 Bing 必应（RSS 结构化 + HTML 双解析）与百度搜索，无需任何 API Key，国内与海外环境均可极速联网。
- **主流 AI 免费额度**：支持 Tavily（1,000 次/月）、Brave Search（2,000 次/月）、Serper/Google（注册赠送 2,500 次）、博查 AI。
- **私有化与开源自建**：支持接入 SearXNG 实例，支持访问 Token 鉴权。
- **海外免 Key 兜底**：集成 DuckDuckGo 搜索。
- **内置可视化设置面板**：在 DSH Web GUI 的设置中心中提供独立的「多源 Web 搜索」页面，支持配置持久化、实时自动保存与在线搜索测试。

---

## 2. 兼容性 (Compatibility)

- **Node.js**: `>= 20.0.0`
- **DeepSeek Harness**: 兼容 mainline `v0.1.0+`
- **已验证系统**: Linux / macOS / Windows

---

## 3. 安装与挂载 (Install)

```bash
dsh plugin --profile web add github:cinob/dsh-web-search-multi
```

然后在 `$DSH_HOME/profiles/web/cordis.patch.yml` 中添加配置（**热重载生效，无需重启 DSH**）：

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

### 卸载插件

1. 从 `$DSH_HOME/profiles/web/cordis.patch.yml` 中移除 `web-search-multi` 和 `web` 相关的覆盖项。
2. 卸载依赖包：
```bash
dsh plugin --profile web remove dsh-web-search-multi
```

---

## 4. 快速上手 (Quick Start)

1. 启动 Web 实例：
   ```bash
   dsh web
   ```
2. 浏览器打开 `http://127.0.0.1:3080`，点击左下角 **「设置」** ➔ **「多源 Web 搜索」**。
3. 选择首选搜索引擎（默认推荐「自动策略」）。
4. （选填）填入你的 Tavily、Brave、Serper 或博查 API Key，即可在对话中直接让 AI 联网搜索。

---

## 5. 配置说明 (Configuration)

### 环境变量
| 变量名 | 说明 |
|---|---|
| `DSH_WEB_SEARCH_PROVIDER` | 指定搜索提供方为 `multi-search` |
| `TAVILY_API_KEY` | Tavily API Key (1,000 次/月) |
| `BRAVE_API_KEY` | Brave Search API Key (2,000 次/月) |
| `SERPER_API_KEY` | Serper Google API Key (2,500 次) |
| `BOCHA_API_KEY` | 博查 AI 搜索 Key |
| `SEARXNG_URL` | SearXNG 实例 URL (例如 `http://localhost:8888`) |
| `SEARXNG_TOKEN` | SearXNG 认证 Token (选填) |

---

## 6. 权限与安全披露 (Permissions & Disclosures)

- **风险等级**: `low`
- **网络访问**: 仅向用户选定或配置的搜索引擎端点发起外网请求。
- **文件系统**: 读写本地持久化配置文件 `~/.dsh/web-search-multi.json`。
- **凭据管理**: 密钥仅保存在本地磁盘，绝不上传第三方服务器。

---

## 7. 常见问题排查 (Troubleshooting)

- **DuckDuckGo `fetch failed`**: 国内环境直连 DuckDuckGo 需要网络代理，建议切换至 `Bing` 或 `Baidu` 免代理直连。
- **配置未生效**: `cordis.patch.yml` 修改后会自动热重载，无需重启服务。

---

## 8. 本地开发与测试 (Development)

```bash
# 克隆仓库
git clone https://github.com/cinob/dsh-web-search-multi.git
cd dsh-web-search-multi

# 构建前后端产物
npm run build

# 运行单元测试
npm test
```

---

## 9. 开源协议 (License)

MIT License.
- 仓库地址: [https://github.com/cinob/dsh-web-search-multi](https://github.com/cinob/dsh-web-search-multi)
