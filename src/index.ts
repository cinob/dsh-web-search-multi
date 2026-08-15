/**
 * `dsh-web-search-multi`: Multi-provider WebSearchProvider for DeepSeek Harness.
 * Supports Tavily, Brave, Serper (Google), Bocha, SearXNG, Bing, Baidu, 360, and DuckDuckGo.
 *
 * @module dsh-web-search-multi
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-web'
import { MultiSearchProvider, MULTI_SEARCH_PROVIDER_ID } from './provider.ts'
import type { MultiSearchConfig } from './types.ts'
import { MultiSearchWebBackend, installMultiSearchWeb } from './web.ts'

export { MULTI_SEARCH_PROVIDER_ID, MultiSearchProvider }
export type { MultiSearchConfig, SearchProviderKind } from './types.ts'

export const WEB_SEARCH_MULTI_SETTINGS_NAMESPACE = 'web-search-multi'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-web-search-multi'

/** The seams this provider registers into and requires. */
export const inject = ['web', 'credentials', 'settings', 'webServer']

/** Register the multi-provider search backend with `ctx.web` and Web GUI routes. */
export function apply(ctx: Context, initialConfig: MultiSearchConfig = {}): void {
  let currentConfig: MultiSearchConfig = {
    provider: 'auto',
    enableFallback: true,
    tavilyApiKeyEnv: 'TAVILY_API_KEY',
    braveApiKeyEnv: 'BRAVE_API_KEY',
    serperApiKeyEnv: 'SERPER_API_KEY',
    bochaApiKeyEnv: 'BOCHA_API_KEY',
    searxngTokenEnv: 'SEARXNG_TOKEN',
    ...initialConfig,
  }

  // Hook into ctx.settings to load persistent settings from ~/.dsh/settings.yaml
  try {
    const scope = ctx.settings.register(WEB_SEARCH_MULTI_SETTINGS_NAMESPACE, undefined, {
      base: currentConfig,
    })
    if (scope) {
      currentConfig = { ...currentConfig, ...scope.get() }
      scope.watch(() => {
        currentConfig = { ...currentConfig, ...scope.get() }
      })
    }
  } catch {
    // ignore
  }

  const resolveCredential = async (ref: string): Promise<string | undefined> => {
    try {
      const credentials = ctx.credentials || ctx.get?.('credentials')
      if (credentials) {
        const hit = await credentials.resolve(ref).catch(() => undefined)
        if (hit && hit.value && hit.value.trim().length > 0) return hit.value
      }
    } catch {
      // ignore
    }

    try {
      const launchEnv = ctx.get?.('launchEnvironment')
      if (launchEnv && typeof launchEnv.get === 'function') {
        const val = launchEnv.get(ref)?.value
        if (val && val.trim().length > 0) return val
      }
    } catch {
      // ignore
    }

    return typeof process !== 'undefined' ? process.env[ref] : undefined
  }

  const resolveEnv = (key: string): string | undefined => {
    try {
      const launchEnv = ctx.get?.('launchEnvironment')
      if (launchEnv && typeof launchEnv.get === 'function') {
        const val = launchEnv.get(key)?.value
        if (val) return val
      }
    } catch {
      // ignore
    }
    return typeof process !== 'undefined' ? process.env[key] : undefined
  }

  // Register with ctx.web
  const searchProvider = new MultiSearchProvider(
    () => currentConfig,
    resolveCredential,
    resolveEnv,
  )

  ctx.web.registerSearchProvider(searchProvider)

  // Web GUI backend
  const backend = new MultiSearchWebBackend(
    ctx,
    () => currentConfig,
    async (updated) => {
      currentConfig = { ...currentConfig, ...updated }
      try {
        const settings = ctx.settings || ctx.get?.('settings')
        if (settings && typeof settings.update === 'function') {
          await settings.update(WEB_SEARCH_MULTI_SETTINGS_NAMESPACE, {
            provider: updated.provider,
            enableFallback: updated.enableFallback,
            searxngUrl: updated.searxngUrl,
          })
        }
      } catch (err) {
        console.warn('[dsh-web-search-multi] Failed to persist settings to ctx.settings:', err)
      }
    },
  )

  installMultiSearchWeb(ctx, backend)
}
