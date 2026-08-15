import type { WebSearchResult, WebSearchSource } from '@deepseek-ai/dsh-web'
import type { ProviderAdapter } from '../types.ts'

export class DuckDuckGoAdapter implements ProviderAdapter {
  readonly id = 'duckduckgo'

  isAvailable(): boolean {
    return true // Always available, zero configuration needed
  }

  async search(query: string, maxResults: number, signal?: AbortSignal): Promise<WebSearchResult> {
    try {
      const formData = new URLSearchParams()
      formData.append('q', query)
      formData.append('b', '')
      formData.append('kl', 'wt-wt')

      const response = await fetch('https://html.duckduckgo.com/html/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5,zh-CN;q=0.3',
        },
        body: formData.toString(),
        signal,
      })

      if (!response.ok) {
        throw new Error(`DuckDuckGo returned HTTP status ${response.status}`)
      }

      const html = await response.text()
      const sources = this.extractResults(html, maxResults)

      if (sources.length === 0) {
        throw new Error('DuckDuckGo returned 0 results (anti-bot triggered)')
      }

      return {
        sources,
        truncated: false,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(
        `DuckDuckGo 无法访问 (${msg})。如在中国大陆网络环境下，DDG 需配置系统代理或 VPN，建议切换为【Bing 必应 (免 Key)】或配置【Tavily / 博查 / SearXNG】使用。`,
      )
    }
  }

  private extractResults(html: string, maxResults: number): WebSearchSource[] {
    const sources: WebSearchSource[] = []

    const resultBlockRegex = /<div class="result results_links[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g
    let blockMatch: RegExpExecArray | null

    while ((blockMatch = resultBlockRegex.exec(html)) !== null && sources.length < maxResults) {
      const block = blockMatch[1]

      const titleMatch = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/i.exec(block)
      const linkMatch = /<a class="result__url"[^>]*href="([^"]+)"/i.exec(block)
      const urlTitleMatch = /<a class="result__title"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block)

      let rawUrl = linkMatch?.[1] || urlTitleMatch?.[1]
      if (!rawUrl) continue

      if (rawUrl.includes('uddg=')) {
        try {
          const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https:${rawUrl}`)
          const uddg = parsed.searchParams.get('uddg')
          if (uddg) rawUrl = decodeURIComponent(uddg)
        } catch {
          // ignore
        }
      }

      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        continue
      }

      const rawTitle = urlTitleMatch?.[2] || ''
      const rawSnippet = titleMatch?.[1] || ''

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
