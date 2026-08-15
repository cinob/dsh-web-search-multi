/**
 * Web-profile routes: HTTP settings & connection testing endpoint for dsh-web-search-multi.
 * @module dsh-web-search-multi/web
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type { MultiSearchConfig, SearchProviderKind } from './types.ts'
import { MultiSearchProvider } from './provider.ts'

export const SETTINGS_ROUTE = '/_dsh/web-search-multi/settings'

export interface MultiSearchSettingsSnapshot {
  config: {
    provider: SearchProviderKind
    enableFallback: boolean
    tavilyApiKeyConfigured: boolean
    braveApiKeyConfigured: boolean
    serperApiKeyConfigured: boolean
    bochaApiKeyConfigured: boolean
    searxngUrl: string
    searxngTokenConfigured: boolean
  }
  providers: Array<{
    id: SearchProviderKind
    name: string
    quotaDesc: string
    available: boolean
    link?: string
  }>
}

export class MultiSearchWebBackend {
  private readonly ctx: Context
  private readonly getConfig: () => MultiSearchConfig
  private readonly saveConfig: (config: MultiSearchConfig) => Promise<void> | void

  constructor(
    ctx: Context,
    getConfig: () => MultiSearchConfig,
    saveConfig: (config: MultiSearchConfig) => Promise<void> | void,
  ) {
    this.ctx = ctx
    this.getConfig = getConfig
    this.saveConfig = saveConfig
  }

  private async isCredentialConfigured(ref: string): Promise<boolean> {
    try {
      const credentials = (this.ctx as any).credentials || this.ctx.get?.('credentials')
      if (credentials) {
        const desc = await credentials.describe(ref).catch(() => undefined)
        if (desc && desc.configured) return true
        const hit = await credentials.resolve(ref).catch(() => undefined)
        if (hit && hit.value && hit.value.trim().length > 0) return true
      }
    } catch {
      // ignore
    }

    try {
      const launchEnv = (this.ctx as any).launchEnvironment
      if (launchEnv && typeof launchEnv.get === 'function') {
        const val = launchEnv.get(ref)?.value
        if (val && val.trim().length > 0) return true
      }
    } catch {
      // ignore
    }

    return Boolean(typeof process !== 'undefined' && process.env[ref]?.trim())
  }

  private async resolveCredentialValue(ref: string): Promise<string | undefined> {
    try {
      const credentials = (this.ctx as any).credentials || this.ctx.get?.('credentials')
      if (credentials) {
        const hit = await credentials.resolve(ref).catch(() => undefined)
        if (hit && hit.value && hit.value.trim().length > 0) return hit.value
      }
    } catch {
      // ignore
    }

    try {
      const launchEnv = (this.ctx as any).launchEnvironment
      if (launchEnv && typeof launchEnv.get === 'function') {
        const val = launchEnv.get(ref)?.value
        if (val && val.trim().length > 0) return val
      }
    } catch {
      // ignore
    }

    return typeof process !== 'undefined' ? process.env[ref] : undefined
  }

  private async storeCredential(ref: string, secret: string | undefined): Promise<void> {
    if (secret === undefined) return
    const credentials = (this.ctx as any).credentials || this.ctx.get?.('credentials')
    if (!credentials) return

    const trimmed = secret.trim()
    if (trimmed.length > 0) {
      await credentials.set(ref, trimmed)
    } else {
      await credentials.unset(ref).catch(() => {})
    }
  }

  async snapshot(): Promise<MultiSearchSettingsSnapshot> {
    const cfg = this.getConfig()
    const tavilyKeyRef = cfg.tavilyApiKeyEnv || 'TAVILY_API_KEY'
    const braveKeyRef = cfg.braveApiKeyEnv || 'BRAVE_API_KEY'
    const serperKeyRef = cfg.serperApiKeyEnv || 'SERPER_API_KEY'
    const bochaKeyRef = cfg.bochaApiKeyEnv || 'BOCHA_API_KEY'
    const searxngTokenRef = cfg.searxngTokenEnv || 'SEARXNG_TOKEN'

    const [
      tavilyApiKeyConfigured,
      braveApiKeyConfigured,
      serperApiKeyConfigured,
      bochaApiKeyConfigured,
      searxngTokenConfigured,
    ] = await Promise.all([
      this.isCredentialConfigured(tavilyKeyRef),
      this.isCredentialConfigured(braveKeyRef),
      this.isCredentialConfigured(serperKeyRef),
      this.isCredentialConfigured(bochaKeyRef),
      this.isCredentialConfigured(searxngTokenRef),
    ])

    const searxngUrl = cfg.searxngUrl || (typeof process !== 'undefined' ? process.env['SEARXNG_URL'] : '') || ''

    return {
      config: {
        provider: cfg.provider ?? 'auto',
        enableFallback: cfg.enableFallback !== false,
        tavilyApiKeyConfigured,
        braveApiKeyConfigured,
        serperApiKeyConfigured,
        bochaApiKeyConfigured,
        searxngUrl,
        searxngTokenConfigured,
      },
      providers: [
        {
          id: 'so360',
          name: '360 搜索 (实时新闻推荐 · 免 Key)',
          quotaDesc: '完全免费、国内实时新闻/时事热点',
          available: true,
          link: 'https://www.so.com',
        },
        {
          id: 'bing',
          name: 'Bing 必应 (免 Key)',
          quotaDesc: '完全免费、国内/全球极速直连',
          available: true,
          link: 'https://cn.bing.com',
        },
        {
          id: 'baidu',
          name: '百度搜索 (免 Key)',
          quotaDesc: '完全免费、国内中文极速直连',
          available: true,
          link: 'https://www.baidu.com',
        },
        {
          id: 'duckduckgo',
          name: 'DuckDuckGo (免 Key)',
          quotaDesc: '完全免费、海外零配置兜底',
          available: true,
          link: 'https://duckduckgo.com',
        },
        {
          id: 'tavily',
          name: 'Tavily AI Search',
          quotaDesc: '每月 1,000 次免费 (带 AI 摘要)',
          available: tavilyApiKeyConfigured,
          link: 'https://tavily.com',
        },
        {
          id: 'brave',
          name: 'Brave Search',
          quotaDesc: '每月 2,000 次免费 (全球独立索引)',
          available: braveApiKeyConfigured,
          link: 'https://brave.com/search/api/',
        },
        {
          id: 'serper',
          name: 'Serper (Google)',
          quotaDesc: '注册赠送 2,500 次调用',
          available: serperApiKeyConfigured,
          link: 'https://serper.dev',
        },
        {
          id: 'bocha',
          name: '博查 AI (Bocha)',
          quotaDesc: '国内 AI 搜索开放平台',
          available: bochaApiKeyConfigured,
          link: 'https://bochaai.com',
        },
        {
          id: 'searxng',
          name: 'SearXNG (自建)',
          quotaDesc: '开源元搜索，支持 Token 保护',
          available: Boolean(searxngUrl),
          link: 'https://docs.searxng.org/',
        },
      ],
    }
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method === 'GET') {
      try {
        const data = await this.snapshot()
        this.json(res, 200, { ok: true, value: data })
      } catch (err) {
        this.json(res, 500, { ok: false, error: String(err) })
      }
      return
    }

    if (req.method === 'POST') {
      try {
        const body = await this.readBody(req)
        if (body.action === 'save') {
          const current = this.getConfig()
          const updated: MultiSearchConfig = {
            ...current,
            provider: body.provider ?? current.provider,
            enableFallback: body.enableFallback !== undefined ? body.enableFallback : current.enableFallback,
            searxngUrl: body.searxngUrl !== undefined ? body.searxngUrl : current.searxngUrl,
          }

          // Save secrets securely into ctx.credentials
          await Promise.all([
            this.storeCredential(current.tavilyApiKeyEnv || 'TAVILY_API_KEY', body.tavilyApiKey),
            this.storeCredential(current.braveApiKeyEnv || 'BRAVE_API_KEY', body.braveApiKey),
            this.storeCredential(current.serperApiKeyEnv || 'SERPER_API_KEY', body.serperApiKey),
            this.storeCredential(current.bochaApiKeyEnv || 'BOCHA_API_KEY', body.bochaApiKey),
            this.storeCredential(current.searxngTokenEnv || 'SEARXNG_TOKEN', body.searxngToken),
          ])

          // Save non-secrets into ctx.settings (settings.yaml)
          await this.saveConfig(updated)

          const data = await this.snapshot()
          this.json(res, 200, { ok: true, value: data })
          return
        }

        if (body.action === 'test') {
          const query = body.query || 'DeepSeek'
          const providerKind = body.provider as SearchProviderKind | undefined
          const testConfig: MultiSearchConfig = {
            ...this.getConfig(),
            provider: providerKind ?? 'auto',
            searxngUrl: body.searxngUrl || this.getConfig().searxngUrl,
          }

          const resolveTestCredential = async (ref: string): Promise<string | undefined> => {
            if (ref === (testConfig.tavilyApiKeyEnv || 'TAVILY_API_KEY') && body.tavilyApiKey) {
              return body.tavilyApiKey
            }
            if (ref === (testConfig.braveApiKeyEnv || 'BRAVE_API_KEY') && body.braveApiKey) {
              return body.braveApiKey
            }
            if (ref === (testConfig.serperApiKeyEnv || 'SERPER_API_KEY') && body.serperApiKey) {
              return body.serperApiKey
            }
            if (ref === (testConfig.bochaApiKeyEnv || 'BOCHA_API_KEY') && body.bochaApiKey) {
              return body.bochaApiKey
            }
            if (ref === (testConfig.searxngTokenEnv || 'SEARXNG_TOKEN') && body.searxngToken) {
              return body.searxngToken
            }
            return this.resolveCredentialValue(ref)
          }

          const start = Date.now()
          const provider = new MultiSearchProvider(testConfig, resolveTestCredential)
          const result = await provider.search({ query, maxResults: 5 })
          const latencyMs = Date.now() - start

          this.json(res, 200, {
            ok: true,
            value: {
              latencyMs,
              result,
            },
          })
          return
        }

        this.json(res, 400, { ok: false, error: 'Unknown action' })
      } catch (err) {
        this.json(res, 500, { ok: false, error: err instanceof Error ? err.message : String(err) })
      }
      return
    }

    res.writeHead(405).end('Method Not Allowed')
  }

  private json(res: ServerResponse, status: number, body: unknown): void {
    const bytes = Buffer.from(JSON.stringify(body))
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Content-Length', String(bytes.length))
    res.setHeader('Cache-Control', 'no-store')
    res.writeHead(status)
    res.end(bytes)
  }

  private async readBody(req: IncomingMessage): Promise<any> {
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  }
}

export function installMultiSearchWeb(
  ctx: Context,
  backend: MultiSearchWebBackend,
): void {
  ctx.inject(['webServer'], (webCtx: any) => {
    webCtx.effect(() => {
      const disposeSettings = webCtx.webServer.register({
        kind: 'exact',
        path: SETTINGS_ROUTE,
        handler: (req: IncomingMessage, res: ServerResponse) => backend.handle(req, res),
      })
      return () => {
        disposeSettings()
      }
    }, 'dsh-web-search-multi: Web routes')
  })
}
