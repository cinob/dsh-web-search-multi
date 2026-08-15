import type { WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class BaiduAdapter implements ProviderAdapter {
  readonly id = 'baidu'

  isAvailable(): boolean {
    return true
  }

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult> {
    const url = new URL('https://www.baidu.com/s')
    url.searchParams.set('wd', query)
    url.searchParams.set('rn', String(maxResults + 3))
    url.searchParams.set('ie', 'utf-8')

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
      throw new Error(`Baidu returned status: ${response.status}`)
    }

    const html = await response.text()
    const sources = this.extractResults(html, maxResults)

    if (sources.length === 0) {
      throw new Error('Baidu returned no search results.')
    }

    return {
      sources,
      truncated: false,
    }
  }

  private extractResults(html: string, maxResults: number): WebSearchSource[] {
    const sources: WebSearchSource[] = []

    // Match each result block <div class="result... c-container..."> ... </div>
    const containerRegex = /<div[^>]*class="[^"]*c-container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*c-container|<div id="content_bottom"|$)/g
    let match: RegExpExecArray | null

    while ((match = containerRegex.exec(html)) !== null && sources.length < maxResults) {
      const block = match[1]

      // Extract title and URL
      const titleLinkMatch = /<h3[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block)
        || /<a[^>]*href="(http[^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block)

      if (!titleLinkMatch) continue

      const rawUrl = titleLinkMatch[1]
      const rawTitle = titleLinkMatch[2]

      // Extract abstract/snippet
      const abstractMatch = /<div[^>]*class="[^"]*(?:c-abstract|content-right|cos-row|summary-text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block)
        || /<span[^>]*class="[^"]*(?:content-right|summary-text)[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(block)

      const rawSnippet = abstractMatch ? abstractMatch[1] : ''

      const cleanTitle = this.cleanText(rawTitle)
      const cleanSnippet = this.cleanText(rawSnippet)

      if (cleanTitle.length === 0) continue

      sources.push({
        url: rawUrl,
        title: cleanTitle,
        snippet: cleanSnippet || undefined,
      })
    }

    return sources
  }

  private cleanText(str: string): string {
    return str
      .replace(/<!--[\s\S]*?-->/g, '') // remove HTML/JSON comments
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '') // remove HTML tags
      .replace(/\{"[\s\S]*?"\}/g, '') // remove JSON blobs
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&emsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}
