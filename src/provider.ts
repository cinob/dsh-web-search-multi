import type {
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
} from '@deepseek-ai/dsh-web'
import type { MultiSearchConfig, ProviderAdapter, SearchProviderKind } from './types.ts'
import { BingAdapter } from './adapters/bing.ts'
import { BaiduAdapter } from './adapters/baidu.ts'
import { TavilyAdapter } from './adapters/tavily.ts'
import { BraveAdapter } from './adapters/brave.ts'
import { SerperAdapter } from './adapters/serper.ts'
import { BochaAdapter } from './adapters/bocha.ts'
import { SearxngAdapter } from './adapters/searxng.ts'
import { DuckDuckGoAdapter } from './adapters/duckduckgo.ts'

export const MULTI_SEARCH_PROVIDER_ID = 'multi-search'

export class MultiSearchProvider implements WebSearchProvider {
  readonly id = MULTI_SEARCH_PROVIDER_ID

  private readonly adapters: Map<SearchProviderKind, ProviderAdapter> = new Map()

  constructor(
    private readonly config: MultiSearchConfig,
    private readonly envGetter: (key: string) => string | undefined,
  ) {
    // Register all supported adapters
    this.adapters.set('bing', new BingAdapter())
    this.adapters.set('baidu', new BaiduAdapter())
    this.adapters.set(
      'tavily',
      new TavilyAdapter(() => this.config.tavilyApiKey || this.envGetter('TAVILY_API_KEY')),
    )
    this.adapters.set(
      'brave',
      new BraveAdapter(() => this.config.braveApiKey || this.envGetter('BRAVE_API_KEY')),
    )
    this.adapters.set(
      'serper',
      new SerperAdapter(() => this.config.serperApiKey || this.envGetter('SERPER_API_KEY')),
    )
    this.adapters.set(
      'bocha',
      new BochaAdapter(() => this.config.bochaApiKey || this.envGetter('BOCHA_API_KEY')),
    )
    this.adapters.set(
      'searxng',
      new SearxngAdapter(
        () => this.config.searxngUrl || this.envGetter('SEARXNG_URL'),
        () => this.config.searxngToken || this.envGetter('SEARXNG_TOKEN'),
      ),
    )
    this.adapters.set('duckduckgo', new DuckDuckGoAdapter())
  }

  available(): boolean {
    const specified = this.config.provider ?? 'auto'
    if (specified !== 'auto') {
      const adapter = this.adapters.get(specified)
      return adapter ? adapter.isAvailable() : false
    }

    // In auto mode, Bing, Baidu or DuckDuckGo or any key-configured adapter is available
    for (const adapter of this.adapters.values()) {
      if (adapter.isAvailable()) return true
    }
    return false
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const specified = this.config.provider ?? 'auto'
    const maxResults = request.maxResults ?? 8
    const enableFallback = this.config.enableFallback !== false

    const candidates: ProviderAdapter[] = []

    if (specified !== 'auto') {
      const selected = this.adapters.get(specified)
      if (selected && selected.isAvailable()) {
        candidates.push(selected)
      }
    }

    // Build the fallback chain: Prioritize high-quality API keys, then Bing, then Baidu, then SearXNG, then DDG
    const priorityOrder: SearchProviderKind[] = [
      'tavily',
      'brave',
      'serper',
      'bocha',
      'bing',
      'baidu',
      'searxng',
      'duckduckgo',
    ]

    for (const kind of priorityOrder) {
      if (kind === specified) continue
      const adapter = this.adapters.get(kind)
      if (adapter && adapter.isAvailable()) {
        candidates.push(adapter)
      }
    }

    if (candidates.length === 0) {
      throw new Error('No web search providers are currently available or configured.')
    }

    const errors: Array<{ provider: string; error: unknown }> = []

    for (const adapter of candidates) {
      if (signal?.aborted) {
        throw new Error('Web search aborted by caller')
      }

      try {
        const result = await adapter.search(request.query, maxResults, signal)
        if (result.sources.length > 0 || result.content) {
          return result
        }
      } catch (err) {
        errors.push({ provider: adapter.id, error: err })
        if (!enableFallback) {
          throw err
        }
        // Continue to next available provider in fallback chain
      }
    }

    // If all failed
    const errorDetails = errors
      .map((e) => `[${e.provider}]: ${e.error instanceof Error ? e.error.message : String(e.error)}`)
      .join('; ')

    throw new Error(`All web search providers failed. Details: ${errorDetails}`)
  }
}
