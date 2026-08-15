import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { MultiSearchConfig } from './types.ts'

export function getConfigFilePath(): string {
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
  return join(dshHome, 'web-search-multi.json')
}

export function loadPersistentConfig(): Partial<MultiSearchConfig> {
  const filePath = getConfigFilePath()
  try {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8')
      return JSON.parse(content) as Partial<MultiSearchConfig>
    }
  } catch (err) {
    console.warn('[dsh-web-search-multi] Failed to read persistent config:', err)
  }
  return {}
}

export function savePersistentConfig(config: MultiSearchConfig): void {
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
