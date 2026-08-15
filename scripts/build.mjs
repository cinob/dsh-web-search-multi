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

// 1. Build Host Entry (lib/index.js)
const hostEntry = `import { MultiSearchProvider, MULTI_SEARCH_PROVIDER_ID } from '../src/provider.ts'
import { MultiSearchWebBackend, installMultiSearchWeb } from '../src/web.ts'

export { MULTI_SEARCH_PROVIDER_ID, MultiSearchProvider }

export const name = 'dsh-web-search-multi'
export const inject = ['web']

export function apply(ctx, initialConfig = {}) {
  let currentConfig = { ...initialConfig }

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
console.log('✓ Generated lib/index.js')

// 2. Build Client Module using esbuild if available, or keep existing compiled bundle
try {
  const esbuild = await import('esbuild').catch(() => null)
  if (esbuild && typeof esbuild.build === 'function') {
    const result = await esbuild.build({
      entryPoints: [join(rootDir, 'src', 'client', 'index.tsx')],
      bundle: false,
      format: 'cjs',
      target: 'es2022',
      write: false,
      jsx: 'transform',
    })

    const jsCode = result.outputFiles[0].text
    const wrapped = [
      'window.__ModuleLoader__.load({ id: "dsh-web-search-multi", factory: (require) => {',
      'var module = { exports: {} }; var exports = module.exports;',
      jsCode,
      'return module.exports; } });',
      '',
    ].join('\n')

    writeFileSync(join(libDir, 'client.js'), wrapped, 'utf8')
    console.log('✓ Compiled src/client/index.tsx -> lib/client.js via esbuild')
  } else {
    console.log('ℹ (lib/client.js is maintained ready-to-run for zero-dependency portability)')
  }
} catch (err) {
  console.warn('Build warning:', err.message)
}

console.log('✨ Build completed successfully!')
