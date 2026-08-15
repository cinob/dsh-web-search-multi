import type { WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class So360Adapter implements ProviderAdapter {
  readonly id = 'so360'

  isAvailable(): boolean {
    return true
  }

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult> {
    const cleanQuery = query.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '').replace(/["'“”‘’]/g, ' ').replace(/\s+/g, ' ').trim()
    const url = new URL('https://www.so.com/s')
    url.searchParams.set('q', cleanQuery)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal,
    })

    if (!response.ok) {
      throw new Error(`360 search returned status: ${response.status}`)
    }

    const html = await response.text()
    const sources = this.extractResults(html, maxResults)

    if (sources.length === 0) {
      throw new Error('360 search returned no results.')
    }

    return {
      sources,
      truncated: false,
    }
  }

  private extractResults(html: string, maxResults: number): WebSearchSource[] {
    const sources: WebSearchSource[] = []
    const listRegex = /<li[^>]*class="[^"]*res-list[^"]*"[^>]*>([\s\S]*?)<\/li>/g
    let match: RegExpExecArray | null

    while ((match = listRegex.exec(html)) !== null && sources.length < maxResults) {
      const block = match[1]
      const titleMatch = /<h3[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block)
      const descMatch = /<p[^>]*class="[^"]*res-desc[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(block)
        || /<div[^>]*class="[^"]*res-desc[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block)

      if (!titleMatch) continue

      const rawUrl = titleMatch[1]
      const rawTitle = titleMatch[2]
      const rawSnippet = descMatch ? descMatch[1] : ''

      const cleanTitle = this.stripHtml(rawTitle).trim()
      const cleanSnippet = this.stripHtml(rawSnippet).trim()

      if (cleanTitle.length === 0 || cleanTitle.includes('相关新闻') || cleanTitle.includes('其他人还搜了')) {
        continue
      }

      sources.push({
        url: rawUrl,
        title: cleanTitle,
        snippet: cleanSnippet || undefined,
      })
    }

    return sources
  }

  private stripHtml(str: string): string {
    return str
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
  }
}
