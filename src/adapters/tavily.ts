import type { WebSearchResult } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class TavilyAdapter implements ProviderAdapter {
  readonly id = 'tavily'

  constructor(private readonly apiKeyProvider: () => string | undefined) {}

  isAvailable(): boolean {
    const key = this.apiKeyProvider()
    return Boolean(key && key.trim().length > 0)
  }

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult> {
    const apiKey = this.apiKeyProvider()
    if (!apiKey) throw new Error('Tavily API key is missing')

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        include_answer: true,
      }),
      signal,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Tavily search failed (${response.status}): ${errText || response.statusText}`)
    }

    const data = await response.json() as {
      answer?: string
      results?: Array<{
        title?: string
        url: string
        content?: string
        published_date?: string
      }>
    }

    return {
      content: data.answer && data.answer.trim().length > 0 ? data.answer : undefined,
      sources: (data.results ?? []).map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.content,
        publishedAt: r.published_date,
      })),
      truncated: false,
    }
  }
}
