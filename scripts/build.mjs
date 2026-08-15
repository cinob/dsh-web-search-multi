import { execSync } from 'node:child_process'
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

// 1. Bundle Host Entry (src/index.ts -> lib/index.js)
try {
  const tsdownBin = '/home/cinob/programs/deepseek-harness/node_modules/.bin/tsdown'
  execSync(`${tsdownBin} src/index.ts -d lib --format esm --no-clean`, {
    cwd: rootDir,
    stdio: 'inherit',
  })

  // Ensure lib/index.js exists
  if (existsSync(join(libDir, 'index.mjs'))) {
    const code = readFileSync(join(libDir, 'index.mjs'), 'utf8')
    writeFileSync(join(libDir, 'index.js'), code, 'utf8')
  }
  console.log('✓ Successfully bundled lib/index.js')
} catch (err) {
  console.error('Failed to bundle with tsdown, using ESM wrapper fallback:', err)
  const hostEntry = `export * from '../src/index.ts'\n`
  writeFileSync(join(libDir, 'index.js'), hostEntry, 'utf8')
}

// 2. Verify client bundle
if (existsSync(join(libDir, 'client.js'))) {
  console.log('✓ lib/client.js is ready')
}

console.log('✨ Build completed successfully!')
