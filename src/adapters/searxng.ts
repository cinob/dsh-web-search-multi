import type { WebSearchResult } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class SearxngAdapter implements ProviderAdapter {
  readonly id = 'searxng'

  constructor(
    private readonly urlProvider: () => string | undefined,
    private readonly tokenProvider?: () => string | undefined,
  ) {}

  isAvailable(): boolean {
    const url = this.urlProvider()
    return Boolean(url && url.trim().length > 0)
  }

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult> {
    const baseUrl = this.urlProvider()
    if (!baseUrl) throw new Error('SearXNG URL is missing')

    const token = this.tokenProvider ? this.tokenProvider() : undefined
    const cleanBase = baseUrl.replace(/\/+$/, '')
    const url = new URL(`${cleanBase}/search`)
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'json')

    if (token && token.trim().length > 0) {
      url.searchParams.set('token', token.trim())
      url.searchParams.set('auth', token.trim())
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    }

    if (token && token.trim().length > 0) {
      headers['Authorization'] = `Bearer ${token.trim()}`
      headers['X-Searxng-Token'] = token.trim()
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal,
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`SearXNG search failed (${response.status}): ${errText || response.statusText}`)
    }

    const data = await response.json() as {
      answers?: string[]
      results?: Array<{
        title?: string
        url: string
        content?: string
        publishedDate?: string
      }>
    }

    const answer = data.answers && data.answers.length > 0 ? data.answers.join('\n') : undefined
    const results = (data.results ?? []).slice(0, maxResults)

    return {
      content: answer,
      sources: results.map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.content,
        publishedAt: r.publishedDate,
      })),
      truncated: false,
    }
  }
}
