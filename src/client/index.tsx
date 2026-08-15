/**
 * DSH Web Search Multi: Client plugin UI for configuring multi-provider search backends,
 * managing free API keys, SearXNG tokens, and testing real-time search queries.
 */

import React, { useState, useEffect } from 'react'

const SETTINGS_ROUTE = '/_dsh/web-search-multi/settings'

interface Snapshot {
  config: {
    provider: string
    enableFallback: boolean
    tavilyApiKeyConfigured: boolean
    braveApiKeyConfigured: boolean
    serperApiKeyConfigured: boolean
    bochaApiKeyConfigured: boolean
    searxngUrl: string
    searxngTokenConfigured: boolean
  }
  providers: Array<{
    id: string
    name: string
    quotaDesc: string
    available: boolean
    link?: string
  }>
}

export function MultiSearchSettingsSection() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Draft form states
  const [selectedProvider, setSelectedProvider] = useState('auto')
  const [enableFallback, setEnableFallback] = useState(true)
  const [tavilyKey, setTavilyKey] = useState('')
  const [braveKey, setBraveKey] = useState('')
  const [serperKey, setSerperKey] = useState('')
  const [bochaKey, setBochaKey] = useState('')
  const [searxngUrl, setSearxngUrl] = useState('')
  const [searxngToken, setSearxngToken] = useState('')

  // Show/Hide password toggles
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  // Test Search states
  const [testQuery, setTestQuery] = useState('DeepSeek AI')
  const [testProvider, setTestProvider] = useState('auto')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch(SETTINGS_ROUTE)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} (${res.statusText})`)
      }
      const json = await res.json()
      if (json.ok && json.value) {
        setSnapshot(json.value)
        setSelectedProvider(json.value.config.provider || 'auto')
        setEnableFallback(json.value.config.enableFallback !== false)
        setSearxngUrl(json.value.config.searxngUrl || '')
      } else {
        throw new Error(json.error || '无法解析后端返回的配置')
      }
    } catch (err) {
      setMessage({ type: 'error', text: '加载配置失败: ' + String(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const saveConfigPayload = async (override: Record<string, any> = {}) => {
    try {
      setSaving(true)
      const payload = {
        action: 'save',
        provider: override.provider !== undefined ? override.provider : selectedProvider,
        enableFallback: override.enableFallback !== undefined ? override.enableFallback : enableFallback,
        searxngUrl: override.searxngUrl !== undefined ? override.searxngUrl : searxngUrl,
        searxngToken: override.searxngToken !== undefined ? override.searxngToken : (searxngToken || undefined),
        tavilyApiKey: override.tavilyApiKey !== undefined ? override.tavilyApiKey : (tavilyKey || undefined),
        braveApiKey: override.braveApiKey !== undefined ? override.braveApiKey : (braveKey || undefined),
        serperApiKey: override.serperApiKey !== undefined ? override.serperApiKey : (serperKey || undefined),
        bochaApiKey: override.bochaApiKey !== undefined ? override.bochaApiKey : (bochaKey || undefined),
      }

      const res = await fetch(SETTINGS_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.ok) {
        setSnapshot(json.value)
        setTavilyKey('')
        setBraveKey('')
        setSerperKey('')
        setBochaKey('')
        setSearxngToken('')
        setMessage({ type: 'success', text: '✓ 配置已持久化保存并立即生效！' })
      } else {
        setMessage({ type: 'error', text: '保存失败: ' + (json.error || '未知错误') })
      }
    } catch (err) {
      setMessage({ type: 'error', text: '网络请求异常: ' + String(err) })
    } finally {
      setSaving(false)
    }
  }

  const handleProviderChange = (val: string) => {
    setSelectedProvider(val)
    void saveConfigPayload({ provider: val })
  }

  const handleFallbackToggle = (val: boolean) => {
    setEnableFallback(val)
    void saveConfigPayload({ enableFallback: val })
  }

  const handleTestSearch = async () => {
    try {
      setTesting(true)
      setTestResult(null)
      const res = await fetch(SETTINGS_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          query: testQuery,
          provider: testProvider,
          searxngUrl: searxngUrl || undefined,
          searxngToken: searxngToken || undefined,
          tavilyApiKey: tavilyKey || undefined,
          braveApiKey: braveKey || undefined,
          serperApiKey: serperKey || undefined,
          bochaApiKey: bochaKey || undefined,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setTestResult(json.value)
      } else {
        setTestResult({ error: json.error || '测试搜索失败' })
      }
    } catch (err) {
      setTestResult({ error: String(err) })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return <div className="dsh-ms-loading">正在加载多源搜索配置…</div>
  }

  return (
    <div className="dsh-ms-container">
      {/* 头部标题与简介 (上面左右结构，下面文字自然铺开) */}
      <div className="dsh-ms-header">
        <div className="dsh-ms-header-top">
          <div className="dsh-ms-title-row">
            <span className="dsh-ms-icon">🌐</span>
            <h2>多源免费 Web 搜索</h2>
          </div>
          <div className="dsh-ms-header-tag">
            <span className="dsh-ms-pill success">● 360 / Bing / 百度免 Key 直连就绪</span>
          </div>
        </div>
        <p className="dsh-ms-subtitle">
          聚合主流包含免费额度的搜索引擎 API 及开源自建引擎，支持自动降级（Auto-Fallback）与 360 / Bing / 百度免 Key 直连兜底。
        </p>
      </div>

      {message && (
        <div className={`dsh-ms-banner ${message.type}`}>
          <span>{message.type === 'success' ? '✓' : '⚠'}</span>
          <div>{message.text}</div>
        </div>
      )}

      {/* 核心策略配置 (垂直分行，修改即时自动保存) */}
      <div className="dsh-ms-section">
        <div className="dsh-ms-section-header">
          <span className="dsh-ms-section-icon">🎯</span>
          <h3>检索调度策略</h3>
        </div>

        <div className="dsh-ms-strategy-stack">
          {/* 第 1 行：首选搜索提供方 (整行) */}
          <div className="dsh-ms-field">
            <label className="dsh-ms-label">首选搜索提供方 (Preferred Provider)</label>
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="dsh-ms-select"
            >
              <option value="auto">🌟 自动策略 (按优先级调用可用 Key，降级至 360 / Bing / 百度 / DDG)</option>
              <option value="so360">360 搜索 (国内实时新闻/时事 · 推荐)</option>
              <option value="bing">Bing 必应 (国内/全球直连免 Key · 推荐)</option>
              <option value="baidu">百度搜索 (国内极速直连 · 免 Key)</option>
              <option value="tavily">Tavily AI Search (每月 1000 次免费)</option>
              <option value="brave">Brave Search (每月 2000 次免费)</option>
              <option value="serper">Serper / Google (注册送 2500 次)</option>
              <option value="bocha">博查 AI (国内 AI 搜索平台)</option>
              <option value="searxng">SearXNG (自建开源无限制)</option>
              <option value="duckduckgo">DuckDuckGo (海外代理免 Key)</option>
            </select>
            <div className="dsh-ms-caption">修改后自动保存。首选引擎故障或额度耗尽时，系统将平滑尝试其他可用引擎。</div>
          </div>

          {/* 第 2 行：自动故障转移策略开关 (整行卡片) */}
          <div className="dsh-ms-toggle-row">
            <div className="dsh-ms-toggle-info">
              <span className="dsh-ms-label">启用自动平滑降级 (Auto Fallback)</span>
              <span className="dsh-ms-caption">遭遇 429 额度不足或网络异常时，自动回退至下一个引擎直到获取结果。</span>
            </div>
            <label className="dsh-ms-switch">
              <input
                type="checkbox"
                id="enableFallback"
                checked={enableFallback}
                onChange={(e) => handleFallbackToggle(e.target.checked)}
              />
              <span className="dsh-ms-switch-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* 免费提供方 API 密钥管理 */}
      <div className="dsh-ms-section">
        <div className="dsh-ms-section-header">
          <span className="dsh-ms-section-icon">🔑</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h3>API 密钥与自建实例</h3>
            <span className="dsh-ms-subtext">密钥仅保存在本地配置，未配置的项将自动跳过</span>
          </div>
        </div>

        <div className="dsh-ms-key-stack">
          {/* Tavily */}
          <div className="dsh-ms-key-item">
            <div className="dsh-ms-item-head">
              <div className="dsh-ms-item-title">
                <strong>Tavily Search API</strong>
                <span className="dsh-ms-badge blue">1,000 次/月免费</span>
                <a href="https://tavily.com" target="_blank" rel="noreferrer" className="dsh-ms-link">
                  免费注册 ↗
                </a>
              </div>
              {snapshot?.config.tavilyApiKeyConfigured && (
                <span className="dsh-ms-status-tag">✓ 已配置</span>
              )}
            </div>
            <div className="dsh-ms-input-row">
              <input
                type={showKeys.tavily ? 'text' : 'password'}
                placeholder={snapshot?.config.tavilyApiKeyConfigured ? '•••••••••••••••••••• (输入新值覆盖)' : '填入 tvly-xxxxxxxxxxxxxxxxxxxx'}
                value={tavilyKey}
                onChange={(e) => setTavilyKey(e.target.value)}
                className="dsh-ms-input"
              />
              <button
                type="button"
                className="dsh-ms-icon-btn"
                onClick={() => toggleShowKey('tavily')}
                title={showKeys.tavily ? '隐藏密钥' : '显示密钥'}
              >
                {showKeys.tavily ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Brave */}
          <div className="dsh-ms-key-item">
            <div className="dsh-ms-item-head">
              <div className="dsh-ms-item-title">
                <strong>Brave Search API</strong>
                <span className="dsh-ms-badge purple">2,000 次/月免费</span>
                <a href="https://brave.com/search/api/" target="_blank" rel="noreferrer" className="dsh-ms-link">
                  免费注册 ↗
                </a>
              </div>
              {snapshot?.config.braveApiKeyConfigured && (
                <span className="dsh-ms-status-tag">✓ 已配置</span>
              )}
            </div>
            <div className="dsh-ms-input-row">
              <input
                type={showKeys.brave ? 'text' : 'password'}
                placeholder={snapshot?.config.braveApiKeyConfigured ? '•••••••••••••••••••• (输入新值覆盖)' : '填入 BSAxxxxxxxxxxxxxxxxxxxx'}
                value={braveKey}
                onChange={(e) => setBraveKey(e.target.value)}
                className="dsh-ms-input"
              />
              <button
                type="button"
                className="dsh-ms-icon-btn"
                onClick={() => toggleShowKey('brave')}
                title={showKeys.brave ? '隐藏密钥' : '显示密钥'}
              >
                {showKeys.brave ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Serper */}
          <div className="dsh-ms-key-item">
            <div className="dsh-ms-item-head">
              <div className="dsh-ms-item-title">
                <strong>Serper (Google SERP)</strong>
                <span className="dsh-ms-badge green">免费赠送 2,500 次</span>
                <a href="https://serper.dev" target="_blank" rel="noreferrer" className="dsh-ms-link">
                  免费注册 ↗
                </a>
              </div>
              {snapshot?.config.serperApiKeyConfigured && (
                <span className="dsh-ms-status-tag">✓ 已配置</span>
              )}
            </div>
            <div className="dsh-ms-input-row">
              <input
                type={showKeys.serper ? 'text' : 'password'}
                placeholder={snapshot?.config.serperApiKeyConfigured ? '•••••••••••••••••••• (输入新值覆盖)' : '填入 Serper API Key'}
                value={serperKey}
                onChange={(e) => setSerperKey(e.target.value)}
                className="dsh-ms-input"
              />
              <button
                type="button"
                className="dsh-ms-icon-btn"
                onClick={() => toggleShowKey('serper')}
                title={showKeys.serper ? '隐藏密钥' : '显示密钥'}
              >
                {showKeys.serper ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* 博查 Bocha */}
          <div className="dsh-ms-key-item">
            <div className="dsh-ms-item-head">
              <div className="dsh-ms-item-title">
                <strong>博查 AI (Bocha)</strong>
                <span className="dsh-ms-badge orange">国内 AI 搜索</span>
                <a href="https://bochaai.com" target="_blank" rel="noreferrer" className="dsh-ms-link">
                  官网申请 ↗
                </a>
              </div>
              {snapshot?.config.bochaApiKeyConfigured && (
                <span className="dsh-ms-status-tag">✓ 已配置</span>
              )}
            </div>
            <div className="dsh-ms-input-row">
              <input
                type={showKeys.bocha ? 'text' : 'password'}
                placeholder={snapshot?.config.bochaApiKeyConfigured ? '•••••••••••••••••••• (输入新值覆盖)' : '填入 sk-xxxxxxxxxxxxxxxxxxxx'}
                value={bochaKey}
                onChange={(e) => setBochaKey(e.target.value)}
                className="dsh-ms-input"
              />
              <button
                type="button"
                className="dsh-ms-icon-btn"
                onClick={() => toggleShowKey('bocha')}
                title={showKeys.bocha ? '隐藏密钥' : '显示密钥'}
              >
                {showKeys.bocha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* SearXNG */}
          <div className="dsh-ms-key-item">
            <div className="dsh-ms-item-head">
              <div className="dsh-ms-item-title">
                <strong>SearXNG (自建开源实例)</strong>
                <span className="dsh-ms-badge cyan">无限制免费</span>
                <a href="https://docs.searxng.org/" target="_blank" rel="noreferrer" className="dsh-ms-link">
                  部署文档 ↗
                </a>
              </div>
              {snapshot?.config.searxngTokenConfigured && (
                <span className="dsh-ms-status-tag">✓ Token 已设置</span>
              )}
            </div>
            <div className="dsh-ms-grid-2">
              <input
                type="text"
                placeholder="实例 URL (如 http://127.0.0.1:8888)"
                value={searxngUrl}
                onChange={(e) => setSearxngUrl(e.target.value)}
                className="dsh-ms-input"
              />
              <div className="dsh-ms-input-row">
                <input
                  type={showKeys.searxng ? 'text' : 'password'}
                  placeholder={snapshot?.config.searxngTokenConfigured ? '•••••• (输入覆盖)' : '访问 Token / 认证密钥 (选填)'}
                  value={searxngToken}
                  onChange={(e) => setSearxngToken(e.target.value)}
                  className="dsh-ms-input"
                />
                <button
                  type="button"
                  className="dsh-ms-icon-btn"
                  onClick={() => toggleShowKey('searxng')}
                  title={showKeys.searxng ? '隐藏 Token' : '显示 Token'}
                >
                  {showKeys.searxng ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="dsh-ms-actions-bar">
          <button
            type="button"
            className="dsh-ms-btn primary"
            onClick={() => saveConfigPayload()}
            disabled={saving}
          >
            {saving ? '正在保存…' : '💾 保存所有输入与密钥'}
          </button>
          <button
            type="button"
            className="dsh-ms-btn ghost"
            onClick={fetchSettings}
            disabled={saving}
          >
            🔄 重新加载
          </button>
        </div>
      </div>

      {/* 连通性测试与搜索体验区 */}
      <div className="dsh-ms-section">
        <div className="dsh-ms-section-header">
          <span className="dsh-ms-section-icon">⚡</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h3>在线连通性测试 & 搜索预览</h3>
            <span className="dsh-ms-subtext">即时验证搜索引擎连接与结果质量</span>
          </div>
        </div>

        <div className="dsh-ms-test-toolbar">
          <select
            value={testProvider}
            onChange={(e) => setTestProvider(e.target.value)}
            className="dsh-ms-select"
            style={{ width: '170px', flexShrink: 0 }}
          >
            <option value="auto">自动测试 (Auto)</option>
            <option value="so360">360 搜索 (实时新闻)</option>
            <option value="bing">Bing 必应 (免 Key)</option>
            <option value="baidu">百度搜索 (免 Key)</option>
            <option value="tavily">Tavily</option>
            <option value="brave">Brave</option>
            <option value="serper">Serper</option>
            <option value="bocha">博查</option>
            <option value="searxng">SearXNG</option>
            <option value="duckduckgo">DuckDuckGo</option>
          </select>

          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="输入搜索关键词..."
            className="dsh-ms-input"
            style={{ flex: 1 }}
          />

          <button
            type="button"
            className="dsh-ms-btn accent"
            onClick={handleTestSearch}
            disabled={testing}
          >
            {testing ? '正在检索…' : '🚀 发起测试'}
          </button>
        </div>

        {/* 测试结果展示 */}
        {testResult && (
          <div className="dsh-ms-result-box">
            {testResult.error ? (
              <div className="dsh-ms-banner error">
                <span>✕</span>
                <div>{testResult.error}</div>
              </div>
            ) : (
              <div className="dsh-ms-result-content">
                <div className="dsh-ms-result-meta">
                  <span className="dsh-ms-status-ok">● 检索成功</span>
                  <div className="dsh-ms-meta-badges">
                    <span className="dsh-ms-pill">耗时: <strong>{testResult.latencyMs} ms</strong></span>
                    <span className="dsh-ms-pill">来源数: <strong>{testResult.result?.sources?.length ?? 0}</strong></span>
                  </div>
                </div>

                {testResult.result?.content && (
                  <div className="dsh-ms-summary-card">
                    <div className="dsh-ms-summary-head">💡 AI 智能总结 / 摘要：</div>
                    <div className="dsh-ms-summary-body">{testResult.result.content}</div>
                  </div>
                )}

                <div className="dsh-ms-source-cards">
                  {testResult.result?.sources?.map((s: any, idx: number) => (
                    <div key={idx} className="dsh-ms-source-card">
                      <div className="dsh-ms-source-header">
                        <a href={s.url} target="_blank" rel="noreferrer" className="dsh-ms-source-link">
                          <span className="dsh-ms-source-num">{idx + 1}.</span> {s.title || s.url}
                        </a>
                        {s.publishedAt && <span className="dsh-ms-source-time">{s.publishedAt}</span>}
                      </div>
                      {s.snippet && <div className="dsh-ms-source-body">{s.snippet}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const CSS = `
.dsh-ms-container {
  display: grid;
  gap: 16px;
  max-width: 900px;
  padding: 6px 2px 40px;
  font-family: inherit;
  color: var(--dsw-alias-label-primary, var(--dsw-alias-fg-primary, currentColor));
}

.dsh-ms-loading {
  padding: 32px;
  text-align: center;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-fg-muted, #71767b));
  font-size: 14px;
}

/* Header (Top: 左右结构, Bottom: 铺开) */
.dsh-ms-header {
  display: grid;
  gap: 8px;
  width: 100%;
}

.dsh-ms-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dsh-ms-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsh-ms-title-row h2 {
  font-size: 20px;
  font-weight: 650;
  margin: 0;
  color: var(--dsw-alias-label-primary, var(--dsw-alias-fg-primary, currentColor));
  letter-spacing: -0.01em;
}

.dsh-ms-icon {
  font-size: 20px;
}

.dsh-ms-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-fg-muted, #71767b));
  line-height: 1.5;
  width: 100%;
}

.dsh-ms-header-tag {
  flex-shrink: 0;
}

.dsh-ms-pill {
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2, rgba(125, 125, 125, 0.08)));
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-fg-muted, #71767b));
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(125, 125, 125, 0.15)));
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dsh-ms-pill.success {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  border-color: rgba(34, 197, 94, 0.3);
  font-weight: 600;
}

/* Custom Nav Globe Icon */
.dsh-ms-nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  stroke: currentColor;
  fill: none;
  opacity: 0.85;
}

/* Banners */
.dsh-ms-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
}

.dsh-ms-banner.success {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.25);
}

.dsh-ms-banner.error {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

/* Section Card */
.dsh-ms-section {
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(125, 125, 125, 0.15)));
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1, transparent);
  padding: 16px;
  display: grid;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.dsh-ms-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsh-ms-section-icon {
  font-size: 16px;
}

.dsh-ms-section-header h3 {
  font-size: 14px;
  font-weight: 650;
  margin: 0;
  color: var(--dsw-alias-label-primary, var(--dsw-alias-fg-primary, currentColor));
}

.dsh-ms-subtext {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-fg-muted, #71767b));
}

/* Strategy Stack (Vertical full-width rows) */
.dsh-ms-strategy-stack {
  display: grid;
  gap: 12px;
  width: 100%;
}

.dsh-ms-field {
  display: grid;
  gap: 6px;
}

.dsh-ms-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, var(--dsw-alias-fg-primary, currentColor));
}

.dsh-ms-caption {
  font-size: 11px;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-fg-muted, #71767b));
  line-height: 1.45;
}

.dsh-ms-select, .dsh-ms-input {
  height: 36px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(125, 125, 125, 0.2)));
  background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2, rgba(125, 125, 125, 0.06)));
  color: var(--dsw-alias-label-primary, inherit);
  font-size: 13px;
  outline: none;
  transition: border-color .15s, background-color .15s;
  box-sizing: border-box;
  width: 100%;
}

.dsh-ms-select:focus, .dsh-ms-input:focus {
  border-color: var(--dsw-alias-brand-primary-new-colorprimary-new-color, #4176e6);
  background: var(--dsw-alias-bg-layer-1, rgba(125, 125, 125, 0.1));
}

/* Full Width Horizontal Toggle Row */
.dsh-ms-toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2, rgba(125, 125, 125, 0.04)));
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(125, 125, 125, 0.12)));
}

.dsh-ms-toggle-info {
  display: grid;
  gap: 3px;
}

/* Switch */
.dsh-ms-switch {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 22px;
  flex-shrink: 0;
  cursor: pointer;
}

.dsh-ms-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.dsh-ms-switch-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--dsw-alias-bg-module-platform, rgba(125, 125, 125, 0.25));
  border: 1px solid var(--dsw-alias-border-l2, rgba(125, 125, 125, 0.25));
  transition: .2s;
  border-radius: 22px;
}

.dsh-ms-switch-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: #fff;
  transition: .2s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
}

.dsh-ms-switch input:checked + .dsh-ms-switch-slider {
  background-color: #16a34a;
  border-color: #15803d;
}

.dsh-ms-switch input:checked + .dsh-ms-switch-slider:before {
  transform: translateX(16px);
}

/* Key Stack */
.dsh-ms-key-stack {
  display: grid;
  gap: 10px;
}

.dsh-ms-key-item {
  padding: 10px 12px;
  border-radius: 9px;
  background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2, rgba(125, 125, 125, 0.04)));
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(125, 125, 125, 0.12)));
  display: grid;
  gap: 8px;
}

.dsh-ms-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dsh-ms-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.dsh-ms-item-title strong {
  color: var(--dsw-alias-label-primary, var(--dsw-alias-fg-primary, currentColor));
  font-size: 13px;
}

.dsh-ms-link {
  color: var(--dsw-alias-brand-primary-new-colorprimary-new-color, #4176e6);
  text-decoration: none;
  font-size: 11px;
}

.dsh-ms-link:hover {
  text-decoration: underline;
}

.dsh-ms-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 999px;
  font-weight: 500;
}

.dsh-ms-badge.blue { background: rgba(65, 118, 230, 0.12); color: #2d66db; }
.dsh-ms-badge.purple { background: rgba(147, 51, 234, 0.12); color: #7e22ce; }
.dsh-ms-badge.green { background: rgba(34, 197, 94, 0.12); color: #15803d; }
.dsh-ms-badge.orange { background: rgba(249, 115, 22, 0.12); color: #c2410c; }
.dsh-ms-badge.cyan { background: rgba(6, 182, 212, 0.12); color: #0e7490; }

.dsh-ms-status-tag {
  font-size: 11px;
  color: #16a34a;
  font-weight: 600;
}

.dsh-ms-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media(max-width: 680px) {
  .dsh-ms-grid-2 {
    grid-template-columns: 1fr;
  }
}

.dsh-ms-input-row {
  display: flex;
  gap: 6px;
  position: relative;
}

.dsh-ms-input-row .dsh-ms-input {
  flex: 1;
}

.dsh-ms-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 7px;
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(125, 125, 125, 0.2)));
  background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2, rgba(125, 125, 125, 0.06)));
  color: var(--dsw-alias-label-primary, inherit);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 14px;
  transition: all .15s;
  box-sizing: border-box;
}

.dsh-ms-icon-btn:hover {
  background: var(--dsw-alias-bg-layer-1, rgba(125, 125, 125, 0.12));
}

/* Actions Bar */
.dsh-ms-actions-bar {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.dsh-ms-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all .15s ease;
  box-sizing: border-box;
}

.dsh-ms-btn.primary {
  background: #16a34a;
  color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.dsh-ms-btn.primary:hover {
  background: #15803d;
}

.dsh-ms-btn.accent {
  background: #2563eb;
  color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.dsh-ms-btn.accent:hover {
  background: #1d4ed8;
}

.dsh-ms-btn.ghost {
  background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2, rgba(125, 125, 125, 0.06)));
  color: var(--dsw-alias-label-primary, inherit);
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(125, 125, 125, 0.15)));
}

.dsh-ms-btn.ghost:hover {
  background: var(--dsw-alias-bg-layer-1, rgba(125, 125, 125, 0.12));
}

.dsh-ms-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* Test Toolbar */
.dsh-ms-test-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dsh-ms-result-box {
  border-radius: 9px;
  background: var(--dsw-alias-bg-module-platform, var(--dsw-alias-bg-layer-2, rgba(125, 125, 125, 0.03)));
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(125, 125, 125, 0.12)));
  padding: 12px;
}

.dsh-ms-result-content {
  display: grid;
  gap: 10px;
}

.dsh-ms-result-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dsh-ms-status-ok {
  font-size: 13px;
  font-weight: 600;
  color: #16a34a;
}

.dsh-ms-meta-badges {
  display: flex;
  gap: 6px;
}

.dsh-ms-summary-card {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(65, 118, 230, 0.08);
  border-left: 3px solid #3b82f6;
  display: grid;
  gap: 4px;
}

.dsh-ms-summary-head {
  font-size: 12px;
  font-weight: 650;
  color: #2563eb;
}

.dsh-ms-summary-body {
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary, inherit);
}

.dsh-ms-source-cards {
  display: grid;
  gap: 6px;
}

.dsh-ms-source-card {
  padding: 8px 10px;
  border-radius: 7px;
  background: var(--dsw-alias-bg-layer-1, rgba(125, 125, 125, 0.03));
  border: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(125, 125, 125, 0.08)));
  display: grid;
  gap: 3px;
}

.dsh-ms-source-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.dsh-ms-source-link {
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-ms-source-link:hover {
  text-decoration: underline;
}

.dsh-ms-source-num {
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-fg-muted, #71767b));
}

.dsh-ms-source-time {
  font-size: 10px;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-fg-muted, #71767b));
  flex-shrink: 0;
}

.dsh-ms-source-body {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, var(--dsw-alias-fg-muted, #71767b));
  line-height: 1.45;
}
`

const GLOBE_SVG = '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" class="dsh-ms-nav-icon"><circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="2.8" ry="6.5"/><path d="M1.6 8h12.8M2.5 4.5h11M2.5 11.5h11"/></svg>'

function attachNavIconEnhancer() {
  const updateIcon = () => {
    const navButtons = document.querySelectorAll('button')
    navButtons.forEach((btn) => {
      const labelSpan = btn.querySelector('span[class*="navLabel"]') || btn.querySelector('span')
      if (labelSpan && labelSpan.textContent && labelSpan.textContent.includes('多源 Web 搜索')) {
        const existingIcon = btn.querySelector('svg')
        if (existingIcon && !existingIcon.classList.contains('dsh-ms-nav-icon')) {
          existingIcon.style.display = 'none'
          if (!btn.querySelector('.dsh-ms-nav-icon')) {
            const wrap = document.createElement('span')
            wrap.innerHTML = GLOBE_SVG
            const newIcon = wrap.firstElementChild
            if (newIcon) {
              btn.insertBefore(newIcon, labelSpan)
            }
          }
        }
      }
    })
  }

  updateIcon()
  const observer = new MutationObserver(() => {
    updateIcon()
  })
  observer.observe(document.body, { childList: true, subtree: true })

  return () => {
    observer.disconnect()
  }
}

function installStyles() {
  const id = 'dsh-web-search-multi-styles'
  if (document.getElementById(id)) return () => {}
  const style = document.createElement('style')
  style.id = id
  style.textContent = CSS
  document.head.appendChild(style)
  return () => { style.remove() }
}

export const inject = ['slots', 'locale']

export function apply(ctx: any): void {
  ctx.effect(installStyles, 'dsh-web-search-multi: styles')
  ctx.effect(attachNavIconEnhancer, 'dsh-web-search-multi: nav icon')

  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'web-search-multi',
        order: 25,
        label: () => '多源 Web 搜索',
      },
      MultiSearchSettingsSection,
    ),
  )
}
