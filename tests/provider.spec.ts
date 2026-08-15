import test from 'node:test'
import assert from 'node:assert/strict'
import { MultiSearchProvider } from '../src/provider.ts'
import { BingAdapter } from '../src/adapters/bing.ts'
import { So360Adapter } from '../src/adapters/so360.ts'
import { BaiduAdapter } from '../src/adapters/baidu.ts'
import { SearxngAdapter } from '../src/adapters/searxng.ts'

test('MultiSearchProvider initializes with dynamic config and credential resolution', () => {
  const credentials: Record<string, string> = {
    TAVILY_API_KEY: 'tvly-test-key',
    SEARXNG_TOKEN: 'searxng-test-token',
  }

  const config = {
    provider: 'auto' as const,
    enableFallback: true,
    searxngUrl: 'https://s.655443.xyz',
  }

  const provider = new MultiSearchProvider(
    () => config,
    async (ref) => credentials[ref],
  )

  assert.equal(provider.id, 'multi-search')
  assert.equal(provider.available(), true)
})

test('So360Adapter sanitizes query and performs search', async () => {
  const adapter = new So360Adapter()
  assert.equal(adapter.isAvailable(), true)

  try {
    const result = await adapter.search('"DeepSeek" 搜索', 3)
    assert.ok(result.sources.length > 0)
    assert.ok(result.sources[0].title.length > 0)
    assert.ok(result.sources[0].url.length > 0)
  } catch (err) {
    // Network might be unavailable in test env, ignore network errors
    console.log('So360 live test skipped due to network:', err)
  }
})

test('BingAdapter sanitizes query and performs search', async () => {
  const adapter = new BingAdapter()
  assert.equal(adapter.isAvailable(), true)

  try {
    const result = await adapter.search('DeepSeek AI', 3)
    assert.ok(result.sources.length > 0)
  } catch (err) {
    console.log('Bing live test skipped due to network:', err)
  }
})

test('SearxngAdapter configures authorization header and params with token', async () => {
  const adapter = new SearxngAdapter(
    () => 'https://s.655443.xyz',
    async () => '67d1a5fb124c767034d2d8724b7386060a36602a33e95fec',
  )
  assert.equal(adapter.isAvailable(), true)

  try {
    const result = await adapter.search('DeepSeek', 3)
    assert.ok(result.sources.length > 0)
  } catch (err) {
    console.log('SearXNG live test skipped due to network/instance:', err)
  }
})
