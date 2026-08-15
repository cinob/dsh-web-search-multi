import type { WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class BingAdapter implements ProviderAdapter {
  readonly id = 'bing'

  isAvailable(): boolean {
    return true // Always available, zero configuration needed
  }

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult> {
    // Strategy 1: Bing RSS Feed (clean XML, structured, zero anti-bot HTML class changes)
    try {
      const rssUrl = new URL('https://cn.bing.com/search')
      rssUrl.searchParams.set('q', query)
      rssUrl.searchParams.set('format', 'rss')
      rssUrl.searchParams.set('setlang', 'zh-hans')

      const rssResp = await fetch(rssUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
        },
        signal,
      })

      if (rssResp.ok) {
        const xml = await rssResp.text()
        const rssSources = this.extractRssResults(xml, maxResults)
        if (rssSources.length > 0) {
          return {
            sources: rssSources,
            truncated: false,
          }
        }
      }
    } catch {
      // Fall through to HTML search
    }

    // Strategy 2: Bing HTML Search (robust regex covering various Bing layout variations)
    const htmlUrl = new URL('https://cn.bing.com/search')
    htmlUrl.searchParams.set('q', query)
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

  private extractRssResults(xml: string, maxResults: number): WebSearchSource[] {
    const sources: WebSearchSource[] = []
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match: RegExpExecArray | null

    while ((match = itemRegex.exec(xml)) !== null && sources.length < maxResults) {
      const item = match[1]

      const titleMatch = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i.exec(item)
      const linkMatch = /<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i.exec(item)
      const descMatch = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i.exec(item)
      const dateMatch = /<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i.exec(item)

      const url = linkMatch ? linkMatch[1].trim() : ''
      if (!url.startsWith('http://') && !url.startsWith('https://')) continue

      const title = titleMatch ? this.stripHtml(titleMatch[1]).trim() : ''
      const snippet = descMatch ? this.stripHtml(descMatch[1]).trim() : ''
      const publishedAt = dateMatch ? dateMatch[1].trim() : undefined

      sources.push({
        url,
        title: title || undefined,
        snippet: snippet || undefined,
        publishedAt,
      })
    }

    return sources
  }

  private extractHtmlResults(html: string, maxResults: number): WebSearchSource[] {
    const sources: WebSearchSource[] = []

    // Match each result block (b_algo or any search result container)
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
      .replace(/\s+/g, ' ')
  }
}
