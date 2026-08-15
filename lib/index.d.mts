import { Context } from "@deepseek-ai/cordis";
import { WebSearchProvider, WebSearchRequest, WebSearchResult } from "@deepseek-ai/dsh-web";

//#region src/types.d.ts
type SearchProviderKind = 'auto' | 'so360' | 'bing' | 'baidu' | 'tavily' | 'brave' | 'serper' | 'bocha' | 'searxng' | 'duckduckgo';
interface MultiSearchConfig {
  /**
   * Preferred search provider. Defaults to 'auto' (tries available keys in priority order, falling back to 360 / Bing / Baidu).
   */
  provider?: SearchProviderKind;
  /**
   * Whether to automatically fall back to another provider if the active one fails or hits rate limits.
   * Defaults to true.
   */
  enableFallback?: boolean;
  /** SearXNG instance URL (e.g. https://s.655443.xyz). */
  searxngUrl?: string;
  /** Credential reference for Tavily (default: TAVILY_API_KEY). */
  tavilyApiKeyEnv?: string;
  /** Credential reference for Brave (default: BRAVE_API_KEY). */
  braveApiKeyEnv?: string;
  /** Credential reference for Serper (default: SERPER_API_KEY). */
  serperApiKeyEnv?: string;
  /** Credential reference for Bocha (default: BOCHA_API_KEY). */
  bochaApiKeyEnv?: string;
  /** Credential reference for SearXNG Token (default: SEARXNG_TOKEN). */
  searxngTokenEnv?: string;
}
//#endregion
//#region src/provider.d.ts
declare const MULTI_SEARCH_PROVIDER_ID = "multi-search";
declare class MultiSearchProvider implements WebSearchProvider {
  readonly id = "multi-search";
  private readonly adapters;
  private readonly configProvider;
  private readonly resolveCredential;
  private readonly resolveEnv;
  constructor(configOrProvider: MultiSearchConfig | (() => MultiSearchConfig), resolveCredential: (ref: string) => Promise<string | undefined> | string | undefined, resolveEnv?: (key: string) => string | undefined);
  available(): boolean;
  search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult>;
}
//#endregion
//#region src/index.d.ts
declare const WEB_SEARCH_MULTI_SETTINGS_NAMESPACE = "web-search-multi";
/** Cordis plugin name used by loader diagnostics. */
declare const name = "dsh-web-search-multi";
/** The seams this provider registers into and requires. */
declare const inject: string[];
/** Register the multi-provider search backend with `ctx.web` and Web GUI routes. */
declare function apply(ctx: Context, initialConfig?: MultiSearchConfig): void;
//#endregion
export { MULTI_SEARCH_PROVIDER_ID, type MultiSearchConfig, MultiSearchProvider, type SearchProviderKind, WEB_SEARCH_MULTI_SETTINGS_NAMESPACE, apply, inject, name };