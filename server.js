import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(compression());

// croxyproxy風UI
app.get('/', (req, res) => {
  res.send(`
  <html>
    <head>
      <title>Advanced Proxy</title>
      <style>
        body { font-family: Arial; text-align: center; margin-top: 50px; }
        input { width: 400px; padding: 5px; }
        button { padding: 5px 10px; }
      </style>
    </head>
    <body>
      <h1>Advanced Proxy</h1>
      <form method="GET" action="/proxy">
        <input type="text" name="url" placeholder="https://example.com" />
        <button type="submit">Go</button>
      </form>
    </body>
  </html>
  `);
});

// プロキシ処理
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.send("URLを入力してください");

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        'Referer': targetUrl,
        'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': '*/*',
        'Cookie': ''
      },
      redirect: 'follow'
    });

    let html = await response.text();
    const $ = cheerio.load(html);

    // aタグ書き換え
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;
      const newUrl = href.startsWith('http') ? href : new URL(href, targetUrl).href;
      $(el).attr('href', `/proxy?url=${encodeURIComponent(newUrl)}`);
    });

    // img, script, link, iframe の書き換え
    $('[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (!src) return;
      const newSrc = src.startsWith('http') ? src : new URL(src, targetUrl).href;
      $(el).attr('src', `/proxy?url=${encodeURIComponent(newSrc)}`);
    });
    $('link[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      const newHref = href.startsWith('http') ? href : new URL(href, targetUrl).href;
      $(el).attr('href', `/proxy?url=${encodeURIComponent(newHref)}`);
    });
    $('iframe[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (!src) return;
      const newSrc = src.startsWith('http') ? src : new URL(src, targetUrl).href;
      $(el).attr('src', `/proxy?url=${encodeURIComponent(newSrc)}`);
    });

    // JavaScript 内 fetch/ajax 書き換え
    $('script').each((i, el) => {
      let script = $(el).html();
      if (!script) return;
      script = script.replace(/fetch\((['"`])(http[s]?:\/\/[^'"`]+)\1/g, (match, q, url) => {
        return `fetch('${'/proxy?url=' + encodeURIComponent(url)}'`;
      });
      script = script.replace(/XMLHttpRequest/g, 'XMLHttpRequestProxy'); // 簡易的にXHRを置換
      $(el).html(script);
    });

    res.send($.html());
  } catch (err) {
    res.send("取得できませんでした: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Advanced Proxy running on port ${PORT}`);
});
