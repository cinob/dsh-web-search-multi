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
  constructor(
    private readonly ctx: Context,
    private readonly getConfig: () => MultiSearchConfig,
    private readonly saveConfig: (config: MultiSearchConfig) => Promise<void> | void,
    private readonly getEnv: (key: string) => string | undefined,
  ) {}

  async snapshot(): Promise<MultiSearchSettingsSnapshot> {
    const cfg = this.getConfig()
    const tavilyKey = cfg.tavilyApiKey || this.getEnv('TAVILY_API_KEY')
    const braveKey = cfg.braveApiKey || this.getEnv('BRAVE_API_KEY')
    const serperKey = cfg.serperApiKey || this.getEnv('SERPER_API_KEY')
    const bochaKey = cfg.bochaApiKey || this.getEnv('BOCHA_API_KEY')
    const searxngUrl = cfg.searxngUrl || this.getEnv('SEARXNG_URL') || ''
    const searxngToken = cfg.searxngToken || this.getEnv('SEARXNG_TOKEN')

    return {
      config: {
        provider: cfg.provider ?? 'auto',
        enableFallback: cfg.enableFallback !== false,
        tavilyApiKeyConfigured: Boolean(tavilyKey && tavilyKey.trim().length > 0),
        braveApiKeyConfigured: Boolean(braveKey && braveKey.trim().length > 0),
        serperApiKeyConfigured: Boolean(serperKey && serperKey.trim().length > 0),
        bochaApiKeyConfigured: Boolean(bochaKey && bochaKey.trim().length > 0),
        searxngUrl,
        searxngTokenConfigured: Boolean(searxngToken && searxngToken.trim().length > 0),
      },
      providers: [
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
          available: Boolean(tavilyKey),
          link: 'https://tavily.com',
        },
        {
          id: 'brave',
          name: 'Brave Search',
          quotaDesc: '每月 2,000 次免费 (全球独立索引)',
          available: Boolean(braveKey),
          link: 'https://brave.com/search/api/',
        },
        {
          id: 'serper',
          name: 'Serper (Google)',
          quotaDesc: '注册赠送 2,500 次调用',
          available: Boolean(serperKey),
          link: 'https://serper.dev',
        },
        {
          id: 'bocha',
          name: '博查 AI (Bocha)',
          quotaDesc: '国内 AI 搜索开放平台',
          available: Boolean(bochaKey),
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
          if (body.tavilyApiKey !== undefined && body.tavilyApiKey.trim().length > 0) {
            updated.tavilyApiKey = body.tavilyApiKey
          }
          if (body.braveApiKey !== undefined && body.braveApiKey.trim().length > 0) {
            updated.braveApiKey = body.braveApiKey
          }
          if (body.serperApiKey !== undefined && body.serperApiKey.trim().length > 0) {
            updated.serperApiKey = body.serperApiKey
          }
          if (body.bochaApiKey !== undefined && body.bochaApiKey.trim().length > 0) {
            updated.bochaApiKey = body.bochaApiKey
          }
          if (body.searxngToken !== undefined && body.searxngToken.trim().length > 0) {
            updated.searxngToken = body.searxngToken
          }

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
            tavilyApiKey: body.tavilyApiKey || this.getConfig().tavilyApiKey,
            braveApiKey: body.braveApiKey || this.getConfig().braveApiKey,
            serperApiKey: body.serperApiKey || this.getConfig().serperApiKey,
            bochaApiKey: body.bochaApiKey || this.getConfig().bochaApiKey,
            searxngUrl: body.searxngUrl || this.getConfig().searxngUrl,
            searxngToken: body.searxngToken || this.getConfig().searxngToken,
          }

          const start = Date.now()
          const provider = new MultiSearchProvider(testConfig, this.getEnv)
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
