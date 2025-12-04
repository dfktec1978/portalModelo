const fs = require('fs');
const path = require('path');
const RSSParser = require('rss-parser');

async function main() {
  const parser = new RSSParser();
  const sourcesPath = path.join(process.cwd(), 'news-sources.json');
  if (!fs.existsSync(sourcesPath)) {
    console.error('news-sources.json not found. Create one with an array of { name, url } items.');
    process.exit(1);
  }

  const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
  const results = [];

  // helper: try common feed endpoints or discover via HTML
  async function discoverFeedUrl(url) {
    // try as-is first
    try {
      // parser.parseURL will throw if not a feed
      await parser.parseURL(url);
      return url;
    } catch (__) {}

    // try to fetch HTML and look for <link rel="alternate" type="application/rss+xml">
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (res.ok) {
        const html = await res.text();
        const match = html.match(/<link[^>]+type=["'](?:application|text)\/(?:rss|xml)["'][^>]*>/i);
        if (match) {
          const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
          if (hrefMatch) {
            const href = hrefMatch[1];
            const feedUrl = new URL(href, url).toString();
            // test it
            try {
              await parser.parseURL(feedUrl);
              return feedUrl;
            } catch (e) {
              // continue to try common endpoints
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // try common feed endpoints
    const candidates = [
      '/feed',
      '/rss',
      '/rss.xml',
      '/feed.xml',
      '/index.xml',
    ];
    for (const c of candidates) {
      try {
        const attempt = new URL(c, url).toString();
        await parser.parseURL(attempt);
        return attempt;
      } catch (e) {
        // ignore and try next
      }
    }

    return null;
  }

  for (const s of sources) {
    try {
      console.log('Processing source', s.name, s.url);
      const feedUrl = await discoverFeedUrl(s.url);
      if (!feedUrl) {
        console.warn('No feed found for', s.url);
        continue;
      }
      console.log('Found feed for', s.name, feedUrl);
      const feed = await parser.parseURL(feedUrl);
      const items = (feed.items || []).slice(0, 8).map((it) => ({
        title: it.title || '(sem título)',
        link: it.link || null,
        pubDate: it.pubDate || it.isoDate || null,
        contentSnippet: it.contentSnippet || it.content || it.summary || null,
        source: s.name || feed.title || 'Fonte',
      }));
      results.push(...items);
    } catch (e) {
      console.warn('Failed to fetch/parse for', s.url, e.message || e);
    }
  }

  // sort by date desc
  results.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  const outDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'news.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('Wrote', outPath, 'with', results.length, 'items');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
