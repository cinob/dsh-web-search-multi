//#region src/adapters/so360.ts
var So360Adapter = class {
	id = "so360";
	isAvailable() {
		return true;
	}
	async search(query, maxResults, signal) {
		const cleanQuery = query.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, "").replace(/["'“”‘’]/g, " ").replace(/\s+/g, " ").trim();
		const url = new URL("https://www.so.com/s");
		url.searchParams.set("q", cleanQuery);
		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "zh-CN,zh;q=0.9"
			},
			signal
		});
		if (!response.ok) throw new Error(`360 search returned status: ${response.status}`);
		const html = await response.text();
		const sources = this.extractResults(html, maxResults);
		if (sources.length === 0) throw new Error("360 search returned no results.");
		return {
			sources,
			truncated: false
		};
	}
	extractResults(html, maxResults) {
		const sources = [];
		const listRegex = /<li[^>]*class="[^"]*res-list[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
		let match;
		while ((match = listRegex.exec(html)) !== null && sources.length < maxResults) {
			const block = match[1];
			const titleMatch = /<h3[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
			const descMatch = /<p[^>]*class="[^"]*res-desc[^"]*"[^>]*>([\s\S]*?)<\/p>/i.exec(block) || /<div[^>]*class="[^"]*res-desc[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block);
			if (!titleMatch) continue;
			const rawUrl = titleMatch[1];
			const rawTitle = titleMatch[2];
			const rawSnippet = descMatch ? descMatch[1] : "";
			const cleanTitle = this.stripHtml(rawTitle).trim();
			const cleanSnippet = this.stripHtml(rawSnippet).trim();
			if (cleanTitle.length === 0 || cleanTitle.includes("相关新闻") || cleanTitle.includes("其他人还搜了")) continue;
			sources.push({
				url: rawUrl,
				title: cleanTitle,
				snippet: cleanSnippet || void 0
			});
		}
		return sources;
	}
	stripHtml(str) {
		return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
	}
};
//#endregion
//#region src/adapters/bing.ts
var BingAdapter = class {
	id = "bing";
	isAvailable() {
		return true;
	}
	async search(query, maxResults, signal) {
		const cleanQuery = query.replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, "").replace(/["'“”‘’]/g, " ").replace(/\s+/g, " ").trim();
		const htmlUrl = new URL("https://cn.bing.com/search");
		htmlUrl.searchParams.set("q", cleanQuery);
		htmlUrl.searchParams.set("setlang", "zh-hans");
		const response = await fetch(htmlUrl.toString(), {
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7"
			},
			signal
		});
		if (!response.ok) throw new Error(`Bing request failed with status: ${response.status}`);
		const html = await response.text();
		const sources = this.extractHtmlResults(html, maxResults);
		if (sources.length === 0) throw new Error("Bing returned no search results for this query.");
		return {
			sources,
			truncated: false
		};
	}
	extractHtmlResults(html, maxResults) {
		const sources = [];
		const algoRegex = /<li[^>]*class="[^"]*b_algo[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
		let match;
		while ((match = algoRegex.exec(html)) !== null && sources.length < maxResults) {
			const block = match[1];
			const titleLinkMatch = /<h[23][^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h[23]>/i.exec(block) || /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
			if (!titleLinkMatch) continue;
			const rawUrl = titleLinkMatch[1];
			if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) continue;
			const rawTitle = titleLinkMatch[2];
			const snippetMatch = /<div[^>]*class="[^"]*b_caption[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i.exec(block) || /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);
			const rawSnippet = snippetMatch ? snippetMatch[1] : "";
			const cleanTitle = this.stripHtml(rawTitle).trim();
			const cleanSnippet = this.stripHtml(rawSnippet).trim();
			sources.push({
				url: rawUrl,
				title: cleanTitle || void 0,
				snippet: cleanSnippet || void 0
			});
		}
		return sources;
	}
	stripHtml(str) {
		return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&ensp;/g, " ").replace(/&emsp;/g, " ").replace(/&#0183;/g, "·").replace(/\s+/g, " ");
	}
};
//#endregion
//#region src/adapters/baidu.ts
var BaiduAdapter = class {
	id = "baidu";
	isAvailable() {
		return true;
	}
	async search(query, maxResults, signal) {
		const url = new URL("https://www.baidu.com/s");
		url.searchParams.set("wd", query);
		url.searchParams.set("rn", String(maxResults + 3));
		url.searchParams.set("ie", "utf-8");
		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
				"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"Accept-Language": "zh-CN,zh;q=0.9"
			},
			signal
		});
		if (!response.ok) throw new Error(`Baidu returned status: ${response.status}`);
		const html = await response.text();
		const sources = this.extractResults(html, maxResults);
		if (sources.length === 0) throw new Error("Baidu returned no search results.");
		return {
			sources,
			truncated: false
		};
	}
	extractResults(html, maxResults) {
		const sources = [];
		const containerRegex = /<div[^>]*class="[^"]*c-container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*c-container|<div id="content_bottom"|$)/g;
		let match;
		while ((match = containerRegex.exec(html)) !== null && sources.length < maxResults) {
			const block = match[1];
			const titleLinkMatch = /<h3[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block) || /<a[^>]*href="(http[^"]+)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
			if (!titleLinkMatch) continue;
			const rawUrl = titleLinkMatch[1];
			const rawTitle = titleLinkMatch[2];
			const abstractMatch = /<div[^>]*class="[^"]*(?:c-abstract|content-right|cos-row|summary-text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(block) || /<span[^>]*class="[^"]*(?:content-right|summary-text)[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(block);
			const rawSnippet = abstractMatch ? abstractMatch[1] : "";
			const cleanTitle = this.cleanText(rawTitle);
			const cleanSnippet = this.cleanText(rawSnippet);
			if (cleanTitle.length === 0) continue;
			sources.push({
				url: rawUrl,
				title: cleanTitle,
				snippet: cleanSnippet || void 0
			});
		}
		return sources;
	}
	cleanText(str) {
		return str.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]*>/g, "").replace(/\{"[\s\S]*?"\}/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&emsp;/g, " ").replace(/\s+/g, " ").trim();
	}
};
//#endregion
//#region src/adapters/tavily.ts
var TavilyAdapter = class {
	id = "tavily";
	apiKeyProvider;
	constructor(apiKeyProvider) {
		this.apiKeyProvider = apiKeyProvider;
	}
	async isAvailable() {
		const key = await this.apiKeyProvider();
		return Boolean(key && key.trim().length > 0);
	}
	async search(query, maxResults, signal) {
		const apiKey = await this.apiKeyProvider();
		if (!apiKey) throw new Error("Tavily API key is missing");
		const response = await fetch("https://api.tavily.com/search", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				api_key: apiKey,
				query,
				max_results: maxResults,
				include_answer: true
			}),
			signal
		});
		if (!response.ok) {
			const errText = await response.text().catch(() => "");
			throw new Error(`Tavily search failed (${response.status}): ${errText || response.statusText}`);
		}
		const data = await response.json();
		return {
			content: data.answer && data.answer.trim().length > 0 ? data.answer : void 0,
			sources: (data.results ?? []).map((r) => ({
				url: r.url,
				title: r.title,
				snippet: r.content,
				publishedAt: r.published_date
			})),
			truncated: false
		};
	}
};
//#endregion
//#region src/adapters/brave.ts
var BraveAdapter = class {
	id = "brave";
	apiKeyProvider;
	constructor(apiKeyProvider) {
		this.apiKeyProvider = apiKeyProvider;
	}
	async isAvailable() {
		const key = await this.apiKeyProvider();
		return Boolean(key && key.trim().length > 0);
	}
	async search(query, maxResults, signal) {
		const apiKey = await this.apiKeyProvider();
		if (!apiKey) throw new Error("Brave API key is missing");
		const url = new URL("https://api.search.brave.com/res/v1/web/search");
		url.searchParams.set("q", query);
		url.searchParams.set("count", String(Math.min(maxResults, 20)));
		const response = await fetch(url.toString(), {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"X-Subscription-Token": apiKey
			},
			signal
		});
		if (!response.ok) {
			const errText = await response.text().catch(() => "");
			throw new Error(`Brave search failed (${response.status}): ${errText || response.statusText}`);
		}
		return {
			sources: ((await response.json()).web?.results ?? []).map((r) => ({
				url: r.url,
				title: r.title,
				snippet: r.description,
				publishedAt: r.page_age
			})),
			truncated: false
		};
	}
};
//#endregion
//#region src/adapters/serper.ts
var SerperAdapter = class {
	id = "serper";
	apiKeyProvider;
	constructor(apiKeyProvider) {
		this.apiKeyProvider = apiKeyProvider;
	}
	async isAvailable() {
		const key = await this.apiKeyProvider();
		return Boolean(key && key.trim().length > 0);
	}
	async search(query, maxResults, signal) {
		const apiKey = await this.apiKeyProvider();
		if (!apiKey) throw new Error("Serper API key is missing");
		const response = await fetch("https://google.serper.dev/search", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-KEY": apiKey
			},
			body: JSON.stringify({
				q: query,
				num: maxResults
			}),
			signal
		});
		if (!response.ok) {
			const errText = await response.text().catch(() => "");
			throw new Error(`Serper search failed (${response.status}): ${errText || response.statusText}`);
		}
		const data = await response.json();
		const answer = data.answerBox?.answer ?? data.answerBox?.snippet;
		return {
			content: answer && answer.trim().length > 0 ? answer : void 0,
			sources: (data.organic ?? []).map((r) => ({
				url: r.link,
				title: r.title,
				snippet: r.snippet,
				publishedAt: r.date
			})),
			truncated: false
		};
	}
};
//#endregion
//#region src/adapters/bocha.ts
var BochaAdapter = class {
	id = "bocha";
	apiKeyProvider;
	constructor(apiKeyProvider) {
		this.apiKeyProvider = apiKeyProvider;
	}
	async isAvailable() {
		const key = await this.apiKeyProvider();
		return Boolean(key && key.trim().length > 0);
	}
	async search(query, maxResults, signal) {
		const apiKey = await this.apiKeyProvider();
		if (!apiKey) throw new Error("Bocha API key is missing");
		const response = await fetch("https://api.bochaai.com/v1/web-search", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				query,
				freshness: "noLimit",
				summary: true,
				count: maxResults
			}),
			signal
		});
		if (!response.ok) {
			const errText = await response.text().catch(() => "");
			throw new Error(`Bocha search failed (${response.status}): ${errText || response.statusText}`);
		}
		return {
			sources: ((await response.json()).data?.webPages?.value ?? []).map((r) => ({
				url: r.url,
				title: r.name,
				snippet: r.summary || r.snippet,
				publishedAt: r.dateLastCrawled
			})),
			truncated: false
		};
	}
};
//#endregion
//#region src/adapters/searxng.ts
var SearxngAdapter = class {
	id = "searxng";
	urlProvider;
	tokenProvider;
	constructor(urlProvider, tokenProvider) {
		this.urlProvider = urlProvider;
		this.tokenProvider = tokenProvider;
	}
	isAvailable() {
		const url = this.urlProvider();
		return Boolean(url && url.trim().length > 0);
	}
	async search(query, maxResults, signal) {
		const baseUrl = this.urlProvider();
		if (!baseUrl) throw new Error("SearXNG URL is missing");
		const token = this.tokenProvider ? await this.tokenProvider() : void 0;
		const cleanBase = baseUrl.replace(/\/+$/, "");
		const url = new URL(`${cleanBase}/search`);
		url.searchParams.set("q", query);
		url.searchParams.set("format", "json");
		if (token && token.trim().length > 0) {
			url.searchParams.set("token", token.trim());
			url.searchParams.set("auth", token.trim());
		}
		const headers = { "Accept": "application/json" };
		if (token && token.trim().length > 0) {
			headers["Authorization"] = `Bearer ${token.trim()}`;
			headers["X-Searxng-Token"] = token.trim();
		}
		const response = await fetch(url.toString(), {
			method: "GET",
			headers,
			signal
		});
		if (!response.ok) {
			const errText = await response.text().catch(() => "");
			throw new Error(`SearXNG search failed (${response.status}): ${errText || response.statusText}`);
		}
		const data = await response.json();
		return {
			content: data.answers && data.answers.length > 0 ? data.answers.join("\n") : void 0,
			sources: (data.results ?? []).slice(0, maxResults).map((r) => ({
				url: r.url,
				title: r.title,
				snippet: r.content,
				publishedAt: r.publishedDate
			})),
			truncated: false
		};
	}
};
//#endregion
//#region src/adapters/duckduckgo.ts
var DuckDuckGoAdapter = class {
	id = "duckduckgo";
	isAvailable() {
		return true;
	}
	async search(query, maxResults, signal) {
		try {
			const formData = new URLSearchParams();
			formData.append("q", query);
			formData.append("b", "");
			formData.append("kl", "wt-wt");
			const response = await fetch("https://html.duckduckgo.com/html/", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
					"Accept-Language": "en-US,en;q=0.5,zh-CN;q=0.3"
				},
				body: formData.toString(),
				signal
			});
			if (!response.ok) throw new Error(`DuckDuckGo returned HTTP status ${response.status}`);
			const html = await response.text();
			const sources = this.extractResults(html, maxResults);
			if (sources.length === 0) throw new Error("DuckDuckGo returned 0 results (anti-bot triggered)");
			return {
				sources,
				truncated: false
			};
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			throw new Error(`DuckDuckGo 无法访问 (${msg})。如在中国大陆网络环境下，DDG 需配置系统代理或 VPN，建议切换为【Bing 必应 (免 Key)】或配置【Tavily / 博查 / SearXNG】使用。`);
		}
	}
	extractResults(html, maxResults) {
		const sources = [];
		const resultBlockRegex = /<div class="result results_links[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
		let blockMatch;
		while ((blockMatch = resultBlockRegex.exec(html)) !== null && sources.length < maxResults) {
			const block = blockMatch[1];
			const titleMatch = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/i.exec(block);
			const linkMatch = /<a class="result__url"[^>]*href="([^"]+)"/i.exec(block);
			const urlTitleMatch = /<a class="result__title"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i.exec(block);
			let rawUrl = linkMatch?.[1] || urlTitleMatch?.[1];
			if (!rawUrl) continue;
			if (rawUrl.includes("uddg=")) try {
				const uddg = new URL(rawUrl.startsWith("http") ? rawUrl : `https:${rawUrl}`).searchParams.get("uddg");
				if (uddg) rawUrl = decodeURIComponent(uddg);
			} catch {}
			if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) continue;
			const rawTitle = urlTitleMatch?.[2] || "";
			const rawSnippet = titleMatch?.[1] || "";
			const cleanTitle = this.stripHtml(rawTitle).trim();
			const cleanSnippet = this.stripHtml(rawSnippet).trim();
			sources.push({
				url: rawUrl,
				title: cleanTitle || void 0,
				snippet: cleanSnippet || void 0
			});
		}
		return sources;
	}
	stripHtml(str) {
		return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
	}
};
//#endregion
//#region src/provider.ts
const MULTI_SEARCH_PROVIDER_ID = "multi-search";
var MultiSearchProvider = class {
	id = MULTI_SEARCH_PROVIDER_ID;
	adapters = /* @__PURE__ */ new Map();
	configProvider;
	resolveCredential;
	resolveEnv;
	constructor(configOrProvider, resolveCredential, resolveEnv) {
		this.configProvider = typeof configOrProvider === "function" ? configOrProvider : () => configOrProvider;
		this.resolveCredential = resolveCredential;
		this.resolveEnv = resolveEnv || ((k) => typeof process !== "undefined" ? process.env[k] : void 0);
		this.adapters.set("so360", new So360Adapter());
		this.adapters.set("bing", new BingAdapter());
		this.adapters.set("baidu", new BaiduAdapter());
		this.adapters.set("tavily", new TavilyAdapter(async () => {
			const ref = this.configProvider().tavilyApiKeyEnv || "TAVILY_API_KEY";
			return await this.resolveCredential(ref) || this.resolveEnv("TAVILY_API_KEY");
		}));
		this.adapters.set("brave", new BraveAdapter(async () => {
			const ref = this.configProvider().braveApiKeyEnv || "BRAVE_API_KEY";
			return await this.resolveCredential(ref) || this.resolveEnv("BRAVE_API_KEY");
		}));
		this.adapters.set("serper", new SerperAdapter(async () => {
			const ref = this.configProvider().serperApiKeyEnv || "SERPER_API_KEY";
			return await this.resolveCredential(ref) || this.resolveEnv("SERPER_API_KEY");
		}));
		this.adapters.set("bocha", new BochaAdapter(async () => {
			const ref = this.configProvider().bochaApiKeyEnv || "BOCHA_API_KEY";
			return await this.resolveCredential(ref) || this.resolveEnv("BOCHA_API_KEY");
		}));
		this.adapters.set("searxng", new SearxngAdapter(() => this.configProvider().searxngUrl || this.resolveEnv("SEARXNG_URL"), async () => {
			const ref = this.configProvider().searxngTokenEnv || "SEARXNG_TOKEN";
			return await this.resolveCredential(ref) || this.resolveEnv("SEARXNG_TOKEN");
		}));
		this.adapters.set("duckduckgo", new DuckDuckGoAdapter());
	}
	available() {
		return true;
	}
	async search(request, signal) {
		const cleanQuery = (request.query || "").replace(/^[\"'“”‘’\s]+|[\"'“”‘’\s]+$/g, "").replace(/[\"'“”‘’]/g, " ").replace(/\s+/g, " ").trim();
		const config = this.configProvider();
		const specified = config.provider ?? "auto";
		const maxResults = request.maxResults ?? 8;
		const enableFallback = config.enableFallback !== false;
		const candidates = [];
		if (specified !== "auto") {
			const selected = this.adapters.get(specified);
			if (selected && await selected.isAvailable()) candidates.push(selected);
		}
		for (const kind of [
			"tavily",
			"brave",
			"serper",
			"bocha",
			"so360",
			"bing",
			"baidu",
			"searxng",
			"duckduckgo"
		]) {
			if (kind === specified) continue;
			const adapter = this.adapters.get(kind);
			if (adapter && await adapter.isAvailable()) candidates.push(adapter);
		}
		if (candidates.length === 0) throw new Error("No web search providers are currently available or configured.");
		const errors = [];
		for (const adapter of candidates) {
			if (signal?.aborted) throw new Error("Web search aborted by caller");
			try {
				const result = await adapter.search(cleanQuery, maxResults, signal);
				if (result.sources.length > 0 || result.content) return result;
			} catch (err) {
				errors.push({
					provider: adapter.id,
					error: err
				});
				if (!enableFallback) throw err;
			}
		}
		const errorDetails = errors.map((e) => `[${e.provider}]: ${e.error instanceof Error ? e.error.message : String(e.error)}`).join("; ");
		throw new Error(`All web search providers failed. Details: ${errorDetails}`);
	}
};
//#endregion
//#region src/web.ts
const SETTINGS_ROUTE = "/_dsh/web-search-multi/settings";
var MultiSearchWebBackend = class {
	ctx;
	getConfig;
	saveConfig;
	constructor(ctx, getConfig, saveConfig) {
		this.ctx = ctx;
		this.getConfig = getConfig;
		this.saveConfig = saveConfig;
	}
	async isCredentialConfigured(ref) {
		try {
			const credentials = this.ctx.credentials || this.ctx.get?.("credentials");
			if (credentials) {
				const desc = await credentials.describe(ref).catch(() => void 0);
				if (desc && desc.configured) return true;
				const hit = await credentials.resolve(ref).catch(() => void 0);
				if (hit && hit.value && hit.value.trim().length > 0) return true;
			}
		} catch {}
		try {
			const launchEnv = this.ctx.launchEnvironment;
			if (launchEnv && typeof launchEnv.get === "function") {
				const val = launchEnv.get(ref)?.value;
				if (val && val.trim().length > 0) return true;
			}
		} catch {}
		return Boolean(typeof process !== "undefined" && process.env[ref]?.trim());
	}
	async resolveCredentialValue(ref) {
		try {
			const credentials = this.ctx.credentials || this.ctx.get?.("credentials");
			if (credentials) {
				const hit = await credentials.resolve(ref).catch(() => void 0);
				if (hit && hit.value && hit.value.trim().length > 0) return hit.value;
			}
		} catch {}
		try {
			const launchEnv = this.ctx.launchEnvironment;
			if (launchEnv && typeof launchEnv.get === "function") {
				const val = launchEnv.get(ref)?.value;
				if (val && val.trim().length > 0) return val;
			}
		} catch {}
		return typeof process !== "undefined" ? process.env[ref] : void 0;
	}
	async storeCredential(ref, secret) {
		if (secret === void 0) return;
		const credentials = this.ctx.credentials || this.ctx.get?.("credentials");
		if (!credentials) return;
		const trimmed = secret.trim();
		if (trimmed.length > 0) await credentials.set(ref, trimmed);
		else await credentials.unset(ref).catch(() => {});
	}
	async snapshot() {
		const cfg = this.getConfig();
		const tavilyKeyRef = cfg.tavilyApiKeyEnv || "TAVILY_API_KEY";
		const braveKeyRef = cfg.braveApiKeyEnv || "BRAVE_API_KEY";
		const serperKeyRef = cfg.serperApiKeyEnv || "SERPER_API_KEY";
		const bochaKeyRef = cfg.bochaApiKeyEnv || "BOCHA_API_KEY";
		const searxngTokenRef = cfg.searxngTokenEnv || "SEARXNG_TOKEN";
		const [tavilyApiKeyConfigured, braveApiKeyConfigured, serperApiKeyConfigured, bochaApiKeyConfigured, searxngTokenConfigured] = await Promise.all([
			this.isCredentialConfigured(tavilyKeyRef),
			this.isCredentialConfigured(braveKeyRef),
			this.isCredentialConfigured(serperKeyRef),
			this.isCredentialConfigured(bochaKeyRef),
			this.isCredentialConfigured(searxngTokenRef)
		]);
		const searxngUrl = cfg.searxngUrl || (typeof process !== "undefined" ? process.env["SEARXNG_URL"] : "") || "";
		return {
			config: {
				provider: cfg.provider ?? "auto",
				enableFallback: cfg.enableFallback !== false,
				tavilyApiKeyConfigured,
				braveApiKeyConfigured,
				serperApiKeyConfigured,
				bochaApiKeyConfigured,
				searxngUrl,
				searxngTokenConfigured
			},
			providers: [
				{
					id: "so360",
					name: "360 搜索 (实时新闻推荐 · 免 Key)",
					quotaDesc: "完全免费、国内实时新闻/时事热点",
					available: true,
					link: "https://www.so.com"
				},
				{
					id: "bing",
					name: "Bing 必应 (免 Key)",
					quotaDesc: "完全免费、国内/全球极速直连",
					available: true,
					link: "https://cn.bing.com"
				},
				{
					id: "baidu",
					name: "百度搜索 (免 Key)",
					quotaDesc: "完全免费、国内中文极速直连",
					available: true,
					link: "https://www.baidu.com"
				},
				{
					id: "duckduckgo",
					name: "DuckDuckGo (免 Key)",
					quotaDesc: "完全免费、海外零配置兜底",
					available: true,
					link: "https://duckduckgo.com"
				},
				{
					id: "tavily",
					name: "Tavily AI Search",
					quotaDesc: "每月 1,000 次免费 (带 AI 摘要)",
					available: tavilyApiKeyConfigured,
					link: "https://tavily.com"
				},
				{
					id: "brave",
					name: "Brave Search",
					quotaDesc: "每月 2,000 次免费 (全球独立索引)",
					available: braveApiKeyConfigured,
					link: "https://brave.com/search/api/"
				},
				{
					id: "serper",
					name: "Serper (Google)",
					quotaDesc: "注册赠送 2,500 次调用",
					available: serperApiKeyConfigured,
					link: "https://serper.dev"
				},
				{
					id: "bocha",
					name: "博查 AI (Bocha)",
					quotaDesc: "国内 AI 搜索开放平台",
					available: bochaApiKeyConfigured,
					link: "https://bochaai.com"
				},
				{
					id: "searxng",
					name: "SearXNG (自建)",
					quotaDesc: "开源元搜索，支持 Token 保护",
					available: Boolean(searxngUrl),
					link: "https://docs.searxng.org/"
				}
			]
		};
	}
	async handle(req, res) {
		if (req.method === "GET") {
			try {
				const data = await this.snapshot();
				this.json(res, 200, {
					ok: true,
					value: data
				});
			} catch (err) {
				this.json(res, 500, {
					ok: false,
					error: String(err)
				});
			}
			return;
		}
		if (req.method === "POST") {
			try {
				const body = await this.readBody(req);
				if (body.action === "save") {
					const current = this.getConfig();
					const updated = {
						...current,
						provider: body.provider ?? current.provider,
						enableFallback: body.enableFallback !== void 0 ? body.enableFallback : current.enableFallback,
						searxngUrl: body.searxngUrl !== void 0 ? body.searxngUrl : current.searxngUrl
					};
					await Promise.all([
						this.storeCredential(current.tavilyApiKeyEnv || "TAVILY_API_KEY", body.tavilyApiKey),
						this.storeCredential(current.braveApiKeyEnv || "BRAVE_API_KEY", body.braveApiKey),
						this.storeCredential(current.serperApiKeyEnv || "SERPER_API_KEY", body.serperApiKey),
						this.storeCredential(current.bochaApiKeyEnv || "BOCHA_API_KEY", body.bochaApiKey),
						this.storeCredential(current.searxngTokenEnv || "SEARXNG_TOKEN", body.searxngToken)
					]);
					await this.saveConfig(updated);
					const data = await this.snapshot();
					this.json(res, 200, {
						ok: true,
						value: data
					});
					return;
				}
				if (body.action === "test") {
					const query = body.query || "DeepSeek";
					const providerKind = body.provider;
					const testConfig = {
						...this.getConfig(),
						provider: providerKind ?? "auto",
						searxngUrl: body.searxngUrl || this.getConfig().searxngUrl
					};
					const resolveTestCredential = async (ref) => {
						if (ref === (testConfig.tavilyApiKeyEnv || "TAVILY_API_KEY") && body.tavilyApiKey) return body.tavilyApiKey;
						if (ref === (testConfig.braveApiKeyEnv || "BRAVE_API_KEY") && body.braveApiKey) return body.braveApiKey;
						if (ref === (testConfig.serperApiKeyEnv || "SERPER_API_KEY") && body.serperApiKey) return body.serperApiKey;
						if (ref === (testConfig.bochaApiKeyEnv || "BOCHA_API_KEY") && body.bochaApiKey) return body.bochaApiKey;
						if (ref === (testConfig.searxngTokenEnv || "SEARXNG_TOKEN") && body.searxngToken) return body.searxngToken;
						return this.resolveCredentialValue(ref);
					};
					const start = Date.now();
					const result = await new MultiSearchProvider(testConfig, resolveTestCredential).search({
						query,
						maxResults: 5
					});
					const latencyMs = Date.now() - start;
					this.json(res, 200, {
						ok: true,
						value: {
							latencyMs,
							result
						}
					});
					return;
				}
				this.json(res, 400, {
					ok: false,
					error: "Unknown action"
				});
			} catch (err) {
				this.json(res, 500, {
					ok: false,
					error: err instanceof Error ? err.message : String(err)
				});
			}
			return;
		}
		res.writeHead(405).end("Method Not Allowed");
	}
	json(res, status, body) {
		const bytes = Buffer.from(JSON.stringify(body));
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.setHeader("Content-Length", String(bytes.length));
		res.setHeader("Cache-Control", "no-store");
		res.writeHead(status);
		res.end(bytes);
	}
	async readBody(req) {
		const chunks = [];
		for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		return JSON.parse(Buffer.concat(chunks).toString("utf8"));
	}
};
function installMultiSearchWeb(ctx, backend) {
	ctx.inject(["webServer"], (webCtx) => {
		webCtx.effect(() => {
			const disposeSettings = webCtx.webServer.register({
				kind: "exact",
				path: SETTINGS_ROUTE,
				handler: (req, res) => backend.handle(req, res)
			});
			return () => {
				disposeSettings();
			};
		}, "dsh-web-search-multi: Web routes");
	});
}
//#endregion
//#region src/index.ts
const WEB_SEARCH_MULTI_SETTINGS_NAMESPACE = "web-search-multi";
/** Cordis plugin name used by loader diagnostics. */
const name = "dsh-web-search-multi";
/** The web seam this provider registers into. */
const inject = ["web"];
/** Register the multi-provider search backend with `ctx.web` and Web GUI routes. */
function apply(ctx, initialConfig = {}) {
	let currentConfig = {
		provider: "auto",
		enableFallback: true,
		tavilyApiKeyEnv: "TAVILY_API_KEY",
		braveApiKeyEnv: "BRAVE_API_KEY",
		serperApiKeyEnv: "SERPER_API_KEY",
		bochaApiKeyEnv: "BOCHA_API_KEY",
		searxngTokenEnv: "SEARXNG_TOKEN",
		...initialConfig
	};
	ctx.inject(["settings"], (sctx) => {
		try {
			const scope = sctx.settings.register(WEB_SEARCH_MULTI_SETTINGS_NAMESPACE, void 0, { base: currentConfig });
			if (scope) {
				currentConfig = {
					...currentConfig,
					...scope.get()
				};
				scope.watch(() => {
					currentConfig = {
						...currentConfig,
						...scope.get()
					};
				});
			}
		} catch {}
	});
	const resolveCredential = async (ref) => {
		try {
			const credentials = ctx.credentials || ctx.get?.("credentials");
			if (credentials) {
				const hit = await credentials.resolve(ref).catch(() => void 0);
				if (hit && hit.value && hit.value.trim().length > 0) return hit.value;
			}
		} catch {}
		try {
			const launchEnv = ctx.launchEnvironment;
			if (launchEnv && typeof launchEnv.get === "function") {
				const val = launchEnv.get(ref)?.value;
				if (val && val.trim().length > 0) return val;
			}
		} catch {}
		return typeof process !== "undefined" ? process.env[ref] : void 0;
	};
	const resolveEnv = (key) => {
		try {
			const launchEnv = ctx.launchEnvironment;
			if (launchEnv && typeof launchEnv.get === "function") {
				const val = launchEnv.get(key)?.value;
				if (val) return val;
			}
		} catch {}
		return typeof process !== "undefined" ? process.env[key] : void 0;
	};
	const searchProvider = new MultiSearchProvider(() => currentConfig, resolveCredential, resolveEnv);
	ctx.web.registerSearchProvider(searchProvider);
	installMultiSearchWeb(ctx, new MultiSearchWebBackend(ctx, () => currentConfig, async (updated) => {
		currentConfig = {
			...currentConfig,
			...updated
		};
		try {
			const settings = ctx.settings || ctx.get?.("settings");
			if (settings && typeof settings.update === "function") await settings.update(WEB_SEARCH_MULTI_SETTINGS_NAMESPACE, {
				provider: updated.provider,
				enableFallback: updated.enableFallback,
				searxngUrl: updated.searxngUrl
			});
		} catch (err) {
			console.warn("[dsh-web-search-multi] Failed to persist settings to ctx.settings:", err);
		}
	}));
}
//#endregion
export { MULTI_SEARCH_PROVIDER_ID, MultiSearchProvider, WEB_SEARCH_MULTI_SETTINGS_NAMESPACE, apply, inject, name };
