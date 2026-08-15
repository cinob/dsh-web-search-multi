import type { WebSearchResult } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class BraveAdapter implements ProviderAdapter {
  readonly id = 'brave'
  private readonly apiKeyProvider: () => string | undefined

  constructor(apiKeyProvider: () => string | undefined) {
    this.apiKeyProvider = apiKeyProvider
  }

  isAvailable(): boolean {
    const key = this.apiKeyProvider()
    return Boolean(key && key.trim().length > 0)
  }

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult> {
    const apiKey = this.apiKeyProvider()
    if (!apiKey) throw new Error('Brave API key is missing')

    const url = new URL('https://api.search.brave.com/res/v1/web/search')
    url.searchParams.set('q', query)
    url.searchParams.set('count', String(Math.min(maxResults, 20)))

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
      signal,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Brave search failed (${response.status}): ${errText || response.statusText}`)
    }

    const data = await response.json() as {
      web?: {
        results?: Array<{
          title?: string
          url: string
          description?: string
          page_age?: string
        }>
      }
    }

    return {
      sources: (data.web?.results ?? []).map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.description,
        publishedAt: r.page_age,
      })),
      truncated: false,
    }
  }
}
