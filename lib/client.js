window.__ModuleLoader__.load({ id: "dsh-web-search-multi", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = apply;
exports.inject = void 0;
const react_1 = require("react");
const SETTINGS_ROUTE = '/_dsh/web-search-multi/settings';

const e = react_1.createElement;

function MultiSearchSettingsSection() {
  const [snapshot, setSnapshot] = (0, react_1.useState)(null);
  const [loading, setLoading] = (0, react_1.useState)(true);
  const [saving, setSaving] = (0, react_1.useState)(false);
  const [message, setMessage] = (0, react_1.useState)(null);

  const [selectedProvider, setSelectedProvider] = (0, react_1.useState)('auto');
  const [enableFallback, setEnableFallback] = (0, react_1.useState)(true);
  const [tavilyKey, setTavilyKey] = (0, react_1.useState)('');
  const [braveKey, setBraveKey] = (0, react_1.useState)('');
  const [serperKey, setSerperKey] = (0, react_1.useState)('');
  const [bochaKey, setBochaKey] = (0, react_1.useState)('');
  const [searxngUrl, setSearxngUrl] = (0, react_1.useState)('');
  const [searxngToken, setSearxngToken] = (0, react_1.useState)('');

  const [showKeys, setShowKeys] = (0, react_1.useState)({});

  const [testQuery, setTestQuery] = (0, react_1.useState)('DeepSeek AI');
  const [testProvider, setTestProvider] = (0, react_1.useState)('auto');
  const [testing, setTesting] = (0, react_1.useState)(false);
  const [testResult, setTestResult] = (0, react_1.useState)(null);

  const toggleShowKey = (id) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(SETTINGS_ROUTE);
      if (!res.ok) {
        throw new Error('HTTP ' + res.status + ' (' + res.statusText + ')');
      }
      const json = await res.json();
      if (json.ok && json.value) {
        setSnapshot(json.value);
        setSelectedProvider(json.value.config.provider || 'auto');
        setEnableFallback(json.value.config.enableFallback !== false);
        setSearxngUrl(json.value.config.searxngUrl || '');
      } else {
        throw new Error(json.error || '无法解析配置');
      }
    } catch (err) {
      setMessage({ type: 'error', text: '加载配置失败: ' + String(err) });
    } finally {
      setLoading(false);
    }
  };

  (0, react_1.useEffect)(() => {
    fetchSettings();
  }, []);

  const saveConfigPayload = async (override = {}) => {
    try {
      setSaving(true);
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
      };

      const res = await fetch(SETTINGS_ROUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setSnapshot(json.value);
        setTavilyKey('');
        setBraveKey('');
        setSerperKey('');
        setBochaKey('');
        setSearxngToken('');
        setMessage({ type: 'success', text: '✓ 配置已持久化保存并立即生效！' });
      } else {
        setMessage({ type: 'error', text: '保存失败: ' + (json.error || '未知错误') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '网络请求异常: ' + String(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = (val) => {
    setSelectedProvider(val);
    void saveConfigPayload({ provider: val });
  };

  const handleFallbackToggle = (val) => {
    setEnableFallback(val);
    void saveConfigPayload({ enableFallback: val });
  };

  const handleTestSearch = async () => {
    try {
      setTesting(true);
      setTestResult(null);
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
      });
      const json = await res.json();
      if (json.ok) {
        setTestResult(json.value);
      } else {
        setTestResult({ error: json.error || '测试搜索失败' });
      }
    } catch (err) {
      setTestResult({ error: String(err) });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return e('div', { className: 'dsh-ms-loading' }, '正在加载多源搜索配置…');
  }

  return e('div', { className: 'dsh-ms-container' },
    // Header (Top: 左右结构, Bottom: 铺开)
    e('div', { className: 'dsh-ms-header' },
      e('div', { className: 'dsh-ms-header-top' },
        e('div', { className: 'dsh-ms-title-row' },
          e('span', { className: 'dsh-ms-icon' }, '🌐'),
          e('h2', null, '多源免费 Web 搜索')
        ),
        e('div', { className: 'dsh-ms-header-tag' },
          e('span', { className: 'dsh-ms-pill success' }, '● Bing / 百度免 Key 直连就绪')
        )
      ),
      e('p', { className: 'dsh-ms-subtitle' },
        '聚合主流包含免费额度的搜索引擎 API 及开源自建引擎，支持自动降级（Auto-Fallback）与 Bing 必应 / 百度免 Key 直连兜底。'
      )
    ),

    message ? e('div', { className: 'dsh-ms-banner ' + message.type },
      e('span', null, message.type === 'success' ? '✓' : '⚠'),
      e('div', null, message.text)
    ) : null,

    // Strategy Section (垂直分行，修改即时自动保存)
    e('div', { className: 'dsh-ms-section' },
      e('div', { className: 'dsh-ms-section-header' },
        e('span', { className: 'dsh-ms-section-icon' }, '🎯'),
        e('h3', null, '检索调度策略')
      ),
      e('div', { className: 'dsh-ms-strategy-stack' },
        // Row 1: Preferred Select
        e('div', { className: 'dsh-ms-field' },
          e('label', { className: 'dsh-ms-label' }, '首选搜索提供方 (Preferred Provider)'),
          e('select', {
            value: selectedProvider,
            onChange: (evt) => handleProviderChange(evt.target.value),
            className: 'dsh-ms-select'
          },
            e('option', { value: 'auto' }, '🌟 自动策略 (按优先级调用可用 Key，降级至 Bing / 百度 / DDG)'),
            e('option', { value: 'bing' }, 'Bing 必应 (国内/全球直连免 Key · 推荐)'),
            e('option', { value: 'baidu' }, '百度搜索 (国内极速直连 · 免 Key)'),
            e('option', { value: 'tavily' }, 'Tavily AI Search (每月 1000 次免费)'),
            e('option', { value: 'brave' }, 'Brave Search (每月 2000 次免费)'),
            e('option', { value: 'serper' }, 'Serper / Google (注册送 2500 次)'),
            e('option', { value: 'bocha' }, '博查 AI (国内 AI 搜索平台)'),
            e('option', { value: 'searxng' }, 'SearXNG (自建开源无限制)'),
            e('option', { value: 'duckduckgo' }, 'DuckDuckGo (海外代理免 Key)')
          ),
          e('div', { className: 'dsh-ms-caption' }, '修改后自动保存。首选引擎故障或额度耗尽时，系统将平滑尝试其他可用引擎。')
        ),
        // Row 2: Full Width Fallback Switch Card
        e('div', { className: 'dsh-ms-toggle-row' },
          e('div', { className: 'dsh-ms-toggle-info' },
            e('span', { className: 'dsh-ms-label' }, '启用自动平滑降级 (Auto Fallback)'),
            e('span', { className: 'dsh-ms-caption' }, '遭遇 429 额度不足或网络异常时，自动回退至下一个引擎直到获取结果。')
          ),
          e('label', { className: 'dsh-ms-switch' },
            e('input', {
              type: 'checkbox',
              id: 'enableFallback',
              checked: enableFallback,
              onChange: (evt) => handleFallbackToggle(evt.target.checked)
            }),
            e('span', { className: 'dsh-ms-switch-slider' })
          )
        )
      )
    ),

    // API Keys Section
    e('div', { className: 'dsh-ms-section' },
      e('div', { className: 'dsh-ms-section-header' },
        e('span', { className: 'dsh-ms-section-icon' }, '🔑'),
        e('div', { style: { display: 'flex', alignItems: 'baseline', gap: '10px' } },
          e('h3', null, 'API 密钥与自建实例'),
          e('span', { className: 'dsh-ms-subtext' }, '密钥仅保存在本地配置，未配置的项将自动跳过')
        )
      ),
      e('div', { className: 'dsh-ms-key-stack' },
        // Tavily
        e('div', { className: 'dsh-ms-key-item' },
          e('div', { className: 'dsh-ms-item-head' },
            e('div', { className: 'dsh-ms-item-title' },
              e('strong', null, 'Tavily Search API'),
              e('span', { className: 'dsh-ms-badge blue' }, '1,000 次/月免费'),
              e('a', { href: 'https://tavily.com', target: '_blank', rel: 'noreferrer', className: 'dsh-ms-link' }, '免费注册 ↗')
            ),
            snapshot?.config.tavilyApiKeyConfigured ? e('span', { className: 'dsh-ms-status-tag' }, '✓ 已配置') : null
          ),
          e('div', { className: 'dsh-ms-input-row' },
            e('input', {
              type: showKeys.tavily ? 'text' : 'password',
              placeholder: snapshot?.config.tavilyApiKeyConfigured ? '•••••••••••••••••••• (输入新值覆盖)' : '填入 tvly-xxxxxxxxxxxxxxxxxxxx',
              value: tavilyKey,
              onChange: (evt) => setTavilyKey(evt.target.value),
              className: 'dsh-ms-input'
            }),
            e('button', {
              type: 'button',
              className: 'dsh-ms-icon-btn',
              onClick: () => toggleShowKey('tavily'),
              title: showKeys.tavily ? '隐藏密钥' : '显示密钥'
            }, showKeys.tavily ? '🙈' : '👁️')
          )
        ),

        // Brave
        e('div', { className: 'dsh-ms-key-item' },
          e('div', { className: 'dsh-ms-item-head' },
            e('div', { className: 'dsh-ms-item-title' },
              e('strong', null, 'Brave Search API'),
              e('span', { className: 'dsh-ms-badge purple' }, '2,000 次/月免费'),
              e('a', { href: 'https://brave.com/search/api/', target: '_blank', rel: 'noreferrer', className: 'dsh-ms-link' }, '免费注册 ↗')
            ),
            snapshot?.config.braveApiKeyConfigured ? e('span', { className: 'dsh-ms-status-tag' }, '✓ 已配置') : null
          ),
          e('div', { className: 'dsh-ms-input-row' },
            e('input', {
              type: showKeys.brave ? 'text' : 'password',
              placeholder: snapshot?.config.braveApiKeyConfigured ? '•••••••••••••••••••• (输入新值覆盖)' : '填入 BSAxxxxxxxxxxxxxxxxxxxx',
              value: braveKey,
              onChange: (evt) => setBraveKey(evt.target.value),
              className: 'dsh-ms-input'
            }),
            e('button', {
              type: 'button',
              className: 'dsh-ms-icon-btn',
              onClick: () => toggleShowKey('brave'),
              title: showKeys.brave ? '隐藏密钥' : '显示密钥'
            }, showKeys.brave ? '🙈' : '👁️')
          )
        ),

        // Serper
        e('div', { className: 'dsh-ms-key-item' },
          e('div', { className: 'dsh-ms-item-head' },
            e('div', { className: 'dsh-ms-item-title' },
              e('strong', null, 'Serper (Google SERP)'),
              e('span', { className: 'dsh-ms-badge green' }, '免费赠送 2,500 次'),
              e('a', { href: 'https://serper.dev', target: '_blank', rel: 'noreferrer', className: 'dsh-ms-link' }, '免费注册 ↗')
            ),
            snapshot?.config.serperApiKeyConfigured ? e('span', { className: 'dsh-ms-status-tag' }, '✓ 已配置') : null
          ),
          e('div', { className: 'dsh-ms-input-row' },
            e('input', {
              type: showKeys.serper ? 'text' : 'password',
              placeholder: snapshot?.config.serperApiKeyConfigured ? '•••••••••••••••••••• (输入新值覆盖)' : '填入 Serper API Key',
              value: serperKey,
              onChange: (evt) => setSerperKey(evt.target.value),
              className: 'dsh-ms-input'
            }),
            e('button', {
              type: 'button',
              className: 'dsh-ms-icon-btn',
              onClick: () => toggleShowKey('serper'),
              title: showKeys.serper ? '隐藏密钥' : '显示密钥'
            }, showKeys.serper ? '🙈' : '👁️')
          )
        ),

        // Bocha
        e('div', { className: 'dsh-ms-key-item' },
          e('div', { className: 'dsh-ms-item-head' },
            e('div', { className: 'dsh-ms-item-title' },
              e('strong', null, '博查 AI (Bocha)'),
              e('span', { className: 'dsh-ms-badge orange' }, '国内 AI 搜索'),
              e('a', { href: 'https://bochaai.com', target: '_blank', rel: 'noreferrer', className: 'dsh-ms-link' }, '官网申请 ↗')
            ),
            snapshot?.config.bochaApiKeyConfigured ? e('span', { className: 'dsh-ms-status-tag' }, '✓ 已配置') : null
          ),
          e('div', { className: 'dsh-ms-input-row' },
            e('input', {
              type: showKeys.bocha ? 'text' : 'password',
              placeholder: snapshot?.config.bochaApiKeyConfigured ? '•••••••••••••••••••• (输入新值覆盖)' : '填入 sk-xxxxxxxxxxxxxxxxxxxx',
              value: bochaKey,
              onChange: (evt) => setBochaKey(evt.target.value),
              className: 'dsh-ms-input'
            }),
            e('button', {
              type: 'button',
              className: 'dsh-ms-icon-btn',
              onClick: () => toggleShowKey('bocha'),
              title: showKeys.bocha ? '隐藏密钥' : '显示密钥'
            }, showKeys.bocha ? '🙈' : '👁️')
          )
        ),

        // SearXNG
        e('div', { className: 'dsh-ms-key-item' },
          e('div', { className: 'dsh-ms-item-head' },
            e('div', { className: 'dsh-ms-item-title' },
              e('strong', null, 'SearXNG (自建开源实例)'),
              e('span', { className: 'dsh-ms-badge cyan' }, '无限制免费'),
              e('a', { href: 'https://docs.searxng.org/', target: '_blank', rel: 'noreferrer', className: 'dsh-ms-link' }, '部署文档 ↗')
            ),
            snapshot?.config.searxngTokenConfigured ? e('span', { className: 'dsh-ms-status-tag' }, '✓ Token 已设置') : null
          ),
          e('div', { className: 'dsh-ms-grid-2' },
            e('input', {
              type: 'text',
              placeholder: '实例 URL (如 http://127.0.0.1:8888)',
              value: searxngUrl,
              onChange: (evt) => setSearxngUrl(evt.target.value),
              className: 'dsh-ms-input'
            }),
            e('div', { className: 'dsh-ms-input-row' },
              e('input', {
                type: showKeys.searxng ? 'text' : 'password',
                placeholder: snapshot?.config.searxngTokenConfigured ? '•••••• (输入覆盖)' : '访问 Token / 认证密钥 (选填)',
                value: searxngToken,
                onChange: (evt) => setSearxngToken(evt.target.value),
                className: 'dsh-ms-input'
              }),
              e('button', {
                type: 'button',
                className: 'dsh-ms-icon-btn',
                onClick: () => toggleShowKey('searxng'),
                title: showKeys.searxng ? '隐藏 Token' : '显示 Token'
              }, showKeys.searxng ? '🙈' : '👁️')
            )
          )
        )
      ),

      e('div', { className: 'dsh-ms-actions-bar' },
        e('button', {
          type: 'button',
          className: 'dsh-ms-btn primary',
          onClick: () => saveConfigPayload(),
          disabled: saving
        }, saving ? '正在保存…' : '💾 保存所有输入与密钥'),
        e('button', {
          type: 'button',
          className: 'dsh-ms-btn ghost',
          onClick: fetchSettings,
          disabled: saving
        }, '🔄 重新加载')
      )
    ),

    // Test Section
    e('div', { className: 'dsh-ms-section' },
      e('div', { className: 'dsh-ms-section-header' },
        e('span', { className: 'dsh-ms-section-icon' }, '⚡'),
        e('div', { style: { display: 'flex', alignItems: 'baseline', gap: '10px' } },
          e('h3', null, '在线连通性测试 & 搜索预览'),
          e('span', { className: 'dsh-ms-subtext' }, '即时验证搜索引擎连接与结果质量')
        )
      ),
      e('div', { className: 'dsh-ms-test-toolbar' },
        e('select', {
          value: testProvider,
          onChange: (evt) => setTestProvider(evt.target.value),
          className: 'dsh-ms-select',
          style: { width: '170px', flexShrink: 0 }
        },
          e('option', { value: 'auto' }, '自动测试 (Auto)'),
          e('option', { value: 'bing' }, 'Bing 必应 (免 Key)'),
          e('option', { value: 'baidu' }, '百度搜索 (免 Key)'),
          e('option', { value: 'tavily' }, 'Tavily'),
          e('option', { value: 'brave' }, 'Brave'),
          e('option', { value: 'serper' }, 'Serper'),
          e('option', { value: 'bocha' }, '博查'),
          e('option', { value: 'searxng' }, 'SearXNG'),
          e('option', { value: 'duckduckgo' }, 'DuckDuckGo')
        ),
        e('input', {
          type: 'text',
          value: testQuery,
          onChange: (evt) => setTestQuery(evt.target.value),
          placeholder: '输入搜索关键词...',
          className: 'dsh-ms-input',
          style: { flex: 1 }
        }),
        e('button', {
          type: 'button',
          className: 'dsh-ms-btn accent',
          onClick: handleTestSearch,
          disabled: testing
        }, testing ? '正在检索…' : '🚀 发起测试')
      ),

      testResult ? e('div', { className: 'dsh-ms-result-box' },
        testResult.error ? e('div', { className: 'dsh-ms-banner error' },
          e('span', null, '✕'),
          e('div', null, testResult.error)
        ) :
          e('div', { className: 'dsh-ms-result-content' },
            e('div', { className: 'dsh-ms-result-meta' },
              e('span', { className: 'dsh-ms-status-ok' }, '● 检索成功'),
              e('div', { className: 'dsh-ms-meta-badges' },
                e('span', { className: 'dsh-ms-pill' }, '耗时: ', e('strong', null, testResult.latencyMs + ' ms')),
                e('span', { className: 'dsh-ms-pill' }, '来源数: ', e('strong', null, String(testResult.result?.sources?.length || 0)))
              )
            ),
            testResult.result?.content ? e('div', { className: 'dsh-ms-summary-card' },
              e('div', { className: 'dsh-ms-summary-head' }, '💡 AI 智能总结 / 摘要：'),
              e('div', { className: 'dsh-ms-summary-body' }, testResult.result.content)
            ) : null,
            e('div', { className: 'dsh-ms-source-cards' },
              (testResult.result?.sources || []).map((s, idx) =>
                e('div', { key: idx, className: 'dsh-ms-source-card' },
                  e('div', { className: 'dsh-ms-source-header' },
                    e('a', { href: s.url, target: '_blank', rel: 'noreferrer', className: 'dsh-ms-source-link' },
                      e('span', { className: 'dsh-ms-source-num' }, (idx + 1) + '. '),
                      s.title || s.url
                    ),
                    s.publishedAt ? e('span', { className: 'dsh-ms-source-time' }, s.publishedAt) : null
                  ),
                  s.snippet ? e('div', { className: 'dsh-ms-source-body' }, s.snippet) : null
                )
              )
            )
          )
      ) : null
    )
  );
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

exports.inject = ['slots', 'locale']

function apply(ctx) {
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

return module.exports; } });
