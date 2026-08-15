import type { WebSearchResult } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class SerperAdapter implements ProviderAdapter {
  readonly id = 'serper'

  constructor(private readonly apiKeyProvider: () => string | undefined) {}

  isAvailable(): boolean {
    const key = this.apiKeyProvider()
    return Boolean(key && key.trim().length > 0)
  }

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult> {
    const apiKey = this.apiKeyProvider()
    if (!apiKey) throw new Error('Serper API key is missing')

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        q: query,
        num: maxResults,
      }),
      signal,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Serper search failed (${response.status}): ${errText || response.statusText}`)
    }

    const data = await response.json() as {
      answerBox?: { answer?: string; snippet?: string; title?: string }
      organic?: Array<{
        title?: string
        link: string
        snippet?: string
        date?: string
      }>
    }

    const answer = data.answerBox?.answer ?? data.answerBox?.snippet

    return {
      content: answer && answer.trim().length > 0 ? answer : undefined,
      sources: (data.organic ?? []).map((r) => ({
        url: r.link,
        title: r.title,
        snippet: r.snippet,
        publishedAt: r.date,
      })),
      truncated: false,
    }
  }
}
