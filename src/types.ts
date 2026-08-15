import type { WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'

export type SearchProviderKind =
  | 'auto'
  | 'bing'
  | 'baidu'
  | 'tavily'
  | 'brave'
  | 'serper'
  | 'bocha'
  | 'searxng'
  | 'duckduckgo'

export interface MultiSearchConfig {
  /**
   * Preferred search provider. Defaults to 'auto' (tries available keys in priority order, falling back to Bing / Baidu).
   */
  provider?: SearchProviderKind

  /** Tavily API Key (1,000 free searches/month). Falls back to env $TAVILY_API_KEY. */
  tavilyApiKey?: string

  /** Brave Search API Key (2,000 free searches/month). Falls back to env $BRAVE_API_KEY. */
  braveApiKey?: string

  /** Serper (Google SERP) API Key (2,500 free searches). Falls back to env $SERPER_API_KEY. */
  serperApiKey?: string

  /** Bocha (博查) API Key. Falls back to env $BOCHA_API_KEY. */
  bochaApiKey?: string

  /** SearXNG instance URL (e.g. http://localhost:8888). Falls back to env $SEARXNG_URL. */
  searxngUrl?: string

  /** SearXNG Access Token / Secret Key (optional for private/token-protected SearXNG instances). Falls back to env $SEARXNG_TOKEN. */
  searxngToken?: string

  /**
   * Whether to automatically fall back to another provider if the active one fails or hits rate limits.
   * Defaults to true.
   */
  enableFallback?: boolean
}

export interface ProviderAdapter {
  readonly id: SearchProviderKind
  isAvailable(): boolean
  search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult>
}
