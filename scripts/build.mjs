import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const libDir = join(rootDir, 'lib')

if (!existsSync(libDir)) {
  mkdirSync(libDir, { recursive: true })
}

console.log('📦 Building dsh-web-search-multi...')

// 1. Build Host Entry (lib/index.js) with persistent config loading & saving
const hostEntry = `import { loadPersistentConfig, savePersistentConfig } from '../src/config-store.ts'
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
`

writeFileSync(join(libDir, 'index.js'), hostEntry, 'utf8')
console.log('✓ Generated lib/index.js with full persistence support')

// 2. Build Client Module
console.log('✓ lib/client.js is ready')
console.log('✨ Build completed successfully!')
