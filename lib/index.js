import { loadPersistentConfig, savePersistentConfig } from '../src/config-store.ts'
import { MultiSearchProvider, MULTI_SEARCH_PROVIDER_ID } from '../src/provider.ts'
import { MultiSearchWebBackend, installMultiSearchWeb } from '../src/web.ts'

export { MULTI_SEARCH_PROVIDER_ID, MultiSearchProvider }

export const name = 'dsh-web-search-multi'
export const inject = ['web']

export function apply(ctx, initialConfig = {}) {
  const persisted = loadPersistentConfig()
  let currentConfig = {
    ...initialConfig,
    ...persisted,
  }

  const getEnv = (key) => {
    try {
      const launchEnv = ctx.launchEnvironment
      if (launchEnv && typeof launchEnv.get === 'function') {
        const val = launchEnv.get(key)?.value
        if (val) return val
      }
    } catch {
      // ignore
    }
    return typeof process !== 'undefined' ? process.env[key] : undefined
  }

  const registerProvider = () => {
    const provider = new MultiSearchProvider(currentConfig, getEnv)
    return ctx.web.registerSearchProvider(provider)
  }

  let unregisterProvider = registerProvider()

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
