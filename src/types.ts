import type { WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'

export type SearchProviderKind =
  | 'auto'
  | 'so360'
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
   * Preferred search provider. Defaults to 'auto' (tries available keys in priority order, falling back to 360 / Bing / Baidu).
   */
  provider?: SearchProviderKind

  /**
   * Whether to automatically fall back to another provider if the active one fails or hits rate limits.
   * Defaults to true.
   */
  enableFallback?: boolean

  /** SearXNG instance URL (e.g. https://s.655443.xyz). */
  searxngUrl?: string

  /** Credential reference for Tavily (default: TAVILY_API_KEY). */
  tavilyApiKeyEnv?: string

  /** Credential reference for Brave (default: BRAVE_API_KEY). */
  braveApiKeyEnv?: string

  /** Credential reference for Serper (default: SERPER_API_KEY). */
  serperApiKeyEnv?: string

  /** Credential reference for Bocha (default: BOCHA_API_KEY). */
  bochaApiKeyEnv?: string

  /** Credential reference for SearXNG Token (default: SEARXNG_TOKEN). */
  searxngTokenEnv?: string
}

export interface ProviderAdapter {
  readonly id: SearchProviderKind
  isAvailable(): Promise<boolean> | boolean
  search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult>
}
