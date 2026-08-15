import type { WebSearchResult } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class BochaAdapter implements ProviderAdapter {
  readonly id = 'bocha'
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
    if (!apiKey) throw new Error('Bocha API key is missing')

    const response = await fetch('https://api.bochaai.com/v1/web-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        freshness: 'noLimit',
        summary: true,
        count: maxResults,
      }),
      signal,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Bocha search failed (${response.status}): ${errText || response.statusText}`)
    }

    const data = await response.json() as {
      data?: {
        webPages?: {
          value?: Array<{
            name?: string
            url: string
            snippet?: string
            summary?: string
            dateLastCrawled?: string
          }>
        }
      }
    }

    const pages = data.data?.webPages?.value ?? []

    return {
      sources: pages.map((r) => ({
        url: r.url,
        title: r.name,
        snippet: r.summary || r.snippet,
        publishedAt: r.dateLastCrawled,
      })),
      truncated: false,
    }
  }
}
