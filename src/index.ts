/**
 * `dsh-web-search-multi`: Multi-provider WebSearchProvider for DeepSeek Harness.
 * Supports Tavily, Brave, Serper (Google), Bocha, SearXNG, and DuckDuckGo (zero-config free fallback).
 *
 * @module dsh-web-search-multi
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-web'
import { loadPersistentConfig, savePersistentConfig } from './config-store.ts'
import { MultiSearchProvider, MULTI_SEARCH_PROVIDER_ID } from './provider.ts'
import type { MultiSearchConfig } from './types.ts'
import { MultiSearchWebBackend, installMultiSearchWeb } from './web.ts'

export { MULTI_SEARCH_PROVIDER_ID, MultiSearchProvider }
export type { MultiSearchConfig, SearchProviderKind } from './types.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'dsh-web-search-multi'

/** The web seam and optional httpServer this provider registers into. */
export const inject = ['web']

/** Register the multi-provider search backend with `ctx.web` and Web GUI routes. */
export function apply(ctx: Context, initialConfig: MultiSearchConfig = {}): void {
  const persisted = loadPersistentConfig()
  let currentConfig: MultiSearchConfig = {
    ...initialConfig,
    ...persisted,
  }

  const getEnv = (key: string): string | undefined => {
    try {
      const launchEnv = (ctx as any).launchEnvironment
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
  const registerProvider = () => {
    const provider = new MultiSearchProvider(currentConfig, getEnv)
    return ctx.web.registerSearchProvider(provider)
  }

  let unregisterProvider = registerProvider()

  // Web GUI backend
  const backend = new MultiSearchWebBackend(
    ctx,
    () => currentConfig,
    (updated) => {
      currentConfig = { ...updated }
      savePersistentConfig(currentConfig)
      try {
        unregisterProvider()
      } catch {
        // ignore
      }
      unregisterProvider = registerProvider()
    },
    getEnv,
  )

  installMultiSearchWeb(ctx, backend)
}
