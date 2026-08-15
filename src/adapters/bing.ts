import type { WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class BingAdapter implements ProviderAdapter {
  readonly id = 'bing'

  isAvailable(): boolean {
    return true
  }

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult> {
    // Sanitize query: strip surrounding/unescaped quotation marks that force bad exact-match
    const cleanQuery = query.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '').replace(/["'“”‘’]/g, ' ').replace(/\s+/g, ' ').trim()

    const htmlUrl = new URL('https://cn.bing.com/search')
    htmlUrl.searchParams.set('q', cleanQuery)
    htmlUrl.searchParams.set('setlang', 'zh-hans')

    const response = await fetch(htmlUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal,
    })

    if (!response.ok) {
      throw new Error(`Bing request failed with status: ${response.status}`)
    }

    const html = await response.text()
    const sources = this.extractHtmlResults(html, maxResults)

    if (sources.length === 0) {
      throw new Error('Bing returned no search results for this query.')
    }

    return {
      sources,
      truncated: false,
    }
  }

  private extractHtmlResults(html: string, maxResults: number): WebSearchSource[] {
    const sources: WebSearchSource[] = []

    // Match each result block (b_algo)
    const algoRegex = /<li[^>]*class="[^"]*b_algo[^"]*"[^>]*>([\s\S]*?)<\/li>/g
    let match: RegExpExecArray | null

    while ((match = algoRegex.exec(html)) !== null && sources.length < maxResults) {
      const block = match[1]

      // Extract title and URL from <h2> or <h3>
      const titleLinkMatch = /<h[23][^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h[23]>/i.exec(block)
        || /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block)

      if (!titleLinkMatch) continue

      const rawUrl = titleLinkMatch[1]
      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) continue

      const rawTitle = titleLinkMatch[2]

      // Extract snippet
      const snippetMatch = /<div[^>]*class="[^"]*b_caption[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i.exec(block)
        || /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block)

      const rawSnippet = snippetMatch ? snippetMatch[1] : ''

      const cleanTitle = this.stripHtml(rawTitle).trim()
      const cleanSnippet = this.stripHtml(rawSnippet).trim()

      sources.push({
        url: rawUrl,
        title: cleanTitle || undefined,
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
      .replace(/&ensp;/g, ' ')
      .replace(/&emsp;/g, ' ')
      .replace(/&#0183;/g, '·')
      .replace(/\s+/g, ' ')
  }
}
