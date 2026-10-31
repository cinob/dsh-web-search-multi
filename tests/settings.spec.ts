import test from 'node:test'
import assert from 'node:assert/strict'
import { Context, Service } from '/home/cinob/programs/deepseek-harness/vendor/cordis/lib/index.js'
import { SettingsProvider } from '/home/cinob/programs/deepseek-harness/packages/settings/settings/lib/index.js'
import { apply, Config, WEB_SEARCH_MULTI_SETTINGS_NAMESPACE } from '../src/index.ts'
import { SETTINGS_ROUTE } from '../src/web.ts'

class MockSettingsProvider extends SettingsProvider {
  storage: Record<string, any> = {}

  constructor(ctx: Context) {
    super(ctx)
    this.writable = true
  }

  async load() {
    return this.storage
  }

  async persist(ns: string, section: any) {
    this.storage[ns] = section
  }
}

class MockWebProvider extends Service {
  registeredProviders: any[] = []

  constructor(ctx: Context) {
    super(ctx, 'web')
  }

  registerSearchProvider(provider: any) {
    this.registeredProviders.push(provider)
  }
}

class MockWebServerProvider extends Service {
  routes: Array<{ kind: string; path: string; handler: Function }> = []

  constructor(ctx: Context) {
    super(ctx, 'webServer')
  }

  register(route: { kind: string; path: string; handler: Function }) {
    this.routes.push(route)
    return () => {
      this.routes = this.routes.filter((r) => r !== route)
    }
  }
}

test('Config schema validates defaults and custom properties', () => {
  const defaults = Config({})
  assert.equal(defaults.provider, 'auto')
  assert.equal(defaults.enableFallback, true)
  assert.equal(defaults.searxngUrl, '')
  assert.equal(defaults.tavilyApiKeyEnv, 'TAVILY_API_KEY')
  assert.equal(defaults.braveApiKeyEnv, 'BRAVE_API_KEY')
  assert.equal(defaults.serperApiKeyEnv, 'SERPER_API_KEY')
  assert.equal(defaults.bochaApiKeyEnv, 'BOCHA_API_KEY')
  assert.equal(defaults.searxngTokenEnv, 'SEARXNG_TOKEN')

  const overridden = Config({ provider: 'bing', enableFallback: false, searxngUrl: 'https://search.example.com' })
  assert.equal(overridden.provider, 'bing')
  assert.equal(overridden.enableFallback, false)
  assert.equal(overridden.searxngUrl, 'https://search.example.com')
})

test('persisted fields are volatile so DSH settings can write them', () => {
  const dict = Config.dict as Record<string, { meta?: { volatile?: boolean } }>
  for (const key of ['provider', 'enableFallback', 'searxngUrl']) {
    assert.equal(dict[key]?.meta?.volatile, true, `${key} must be volatile`)
  }
})

test('apply registers namespace with ctx.settings and handles settings updates without error', async () => {
  const ctx = new Context()
  const settings = new MockSettingsProvider(ctx)
  const web = new MockWebProvider(ctx)
  const webServer = new MockWebServerProvider(ctx)

  // simulate settings loaded
  settings.publish({})

  // Apply plugin
  apply(ctx, { provider: 'auto', enableFallback: true })

  // Wait for ctx.inject fibers to settle
  await new Promise((r) => setTimeout(r, 10))

  assert.equal(web.registeredProviders.length, 1)
  assert.equal(webServer.routes.length, 1)
  assert.equal(webServer.routes[0].path, SETTINGS_ROUTE)

  // Verify settings namespace is registered
  const currentSettings = settings.get(WEB_SEARCH_MULTI_SETTINGS_NAMESPACE)
  assert.ok(currentSettings)
  assert.equal(currentSettings.provider, 'auto')
  assert.equal(currentSettings.enableFallback, true)

  // Update settings via ctx.settings - this was throwing in Issue #1
  await assert.doesNotReject(async () => {
    await settings.update(WEB_SEARCH_MULTI_SETTINGS_NAMESPACE, {
      provider: 'bing',
      enableFallback: false,
    })
  })

  const updatedSettings = settings.get(WEB_SEARCH_MULTI_SETTINGS_NAMESPACE)
  assert.equal(updatedSettings?.provider, 'bing')
  assert.equal(updatedSettings?.enableFallback, false)
  assert.equal(settings.storage[WEB_SEARCH_MULTI_SETTINGS_NAMESPACE]?.provider, 'bing')
})

test('Web settings backend save action updates and persists to ctx.settings', async () => {
  const ctx = new Context()
  const settings = new MockSettingsProvider(ctx)
  const web = new MockWebProvider(ctx)
  const webServer = new MockWebServerProvider(ctx)

  settings.publish({})
  apply(ctx)

  // Wait for ctx.inject fibers to settle
  await new Promise((r) => setTimeout(r, 10))

  const route = webServer.routes.find((r) => r.path === SETTINGS_ROUTE)
  assert.ok(route)

  // Simulate POST /_dsh/web-search-multi/settings { action: 'save', provider: 'so360', enableFallback: false }
  const payload = JSON.stringify({
    action: 'save',
    provider: 'so360',
    enableFallback: false,
    searxngUrl: 'https://my-searxng.instance',
  })

  const { Readable } = await import('node:stream')
  const req = Readable.from(Buffer.from(payload)) as any
  req.method = 'POST'

  let responseData: any = null
  let statusCode = 0
  const res = {
    setHeader: () => {},
    writeHead: (code: number) => {
      statusCode = code
    },
    end: (data: Buffer) => {
      responseData = JSON.parse(data.toString('utf8'))
    },
  } as any

  await route.handler(req, res)

  assert.equal(statusCode, 200)
  assert.equal(responseData.ok, true)
  assert.equal(responseData.value.config.provider, 'so360')
  assert.equal(responseData.value.config.enableFallback, false)
  assert.equal(responseData.value.config.searxngUrl, 'https://my-searxng.instance')

  // Verify it was persisted in settings storage
  assert.equal(settings.storage[WEB_SEARCH_MULTI_SETTINGS_NAMESPACE]?.provider, 'so360')
  assert.equal(settings.storage[WEB_SEARCH_MULTI_SETTINGS_NAMESPACE]?.enableFallback, false)
  assert.equal(settings.storage[WEB_SEARCH_MULTI_SETTINGS_NAMESPACE]?.searxngUrl, 'https://my-searxng.instance')
})

test('Compiled lib/index.js apply exports work identically with ctx.settings', async () => {
  const lib = await import('../lib/index.js')
  assert.ok(lib.Config)
  assert.equal(typeof lib.apply, 'function')
  assert.equal(lib.WEB_SEARCH_MULTI_SETTINGS_NAMESPACE, 'web-search-multi')

  const ctx = new Context()
  const settings = new MockSettingsProvider(ctx)
  const web = new MockWebProvider(ctx)
  const webServer = new MockWebServerProvider(ctx)

  settings.publish({})
  lib.apply(ctx, { provider: 'baidu' })

  await new Promise((r) => setTimeout(r, 10))

  const registeredSettings = settings.get(lib.WEB_SEARCH_MULTI_SETTINGS_NAMESPACE)
  assert.equal(registeredSettings?.provider, 'baidu')

  await settings.update(lib.WEB_SEARCH_MULTI_SETTINGS_NAMESPACE, {
    provider: 'tavily',
    enableFallback: true,
  })

  const updatedSettings = settings.get(lib.WEB_SEARCH_MULTI_SETTINGS_NAMESPACE)
  assert.equal(updatedSettings?.provider, 'tavily')
  assert.equal(settings.storage[lib.WEB_SEARCH_MULTI_SETTINGS_NAMESPACE]?.provider, 'tavily')
})

test('apply does not throw proxy error when optional services (settings, webServer) are not injected or present', async () => {
  const root = new Context()
  new MockWebProvider(root)

  // Create plugin descriptor with inject: ['web']
  const plugin = {
    name: 'dsh-web-search-multi',
    inject: ['web'],
    apply,
  }

  // Loading plugin in isolated Cordis context should not throw "cannot get property settings without inject"
  assert.doesNotThrow(() => {
    root.plugin(plugin, { provider: 'bing' })
  })
})
