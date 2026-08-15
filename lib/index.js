import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { MultiSearchProvider, MULTI_SEARCH_PROVIDER_ID } from '../src/provider.ts'
import { MultiSearchWebBackend, installMultiSearchWeb } from '../src/web.ts'

export { MULTI_SEARCH_PROVIDER_ID, MultiSearchProvider }

export const name = 'dsh-web-search-multi'
export const inject = ['web']

function getConfigFilePath() {
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(dshHome, 'web-search-multi.json')
}

function loadPersistentConfig() {
  const filePath = getConfigFilePath()
  try {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8')
      return JSON.parse(content)
    }
  } catch (err) {
    console.warn('[dsh-web-search-multi] Failed to read persistent config:', err)
  }
  return {}
}

function savePersistentConfig(config) {
  const filePath = getConfigFilePath()
  try {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8')
  } catch (err) {
    console.warn('[dsh-web-search-multi] Failed to save persistent config:', err)
  }
}

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
