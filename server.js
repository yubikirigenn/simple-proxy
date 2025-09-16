import express from 'express';
import fetch from 'node-fetch';
import { load } from 'cheerio';

const app = express();
const PORT = process.env.PORT || 10000;

// 自作 JS の例
app.get('/my-custom.js', (req, res) => {
  res.type('text/javascript');
  res.send(`console.log("This JS is injected by proxy");`);
});

// ホームページ
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: '.' });
});

// プロキシ
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('URL required');

  try {
    const response = await fetch(url);
    let body = await response.text();

    // HTML 書き換え
    const $ = load(body);

    // すべてのリンクを書き換え
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http')) {
        $(el).attr('href', `/proxy?url=${encodeURIComponent(href)}`);
      }
    });

    // スクリプト差し替え例
    $('script[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src.includes('example.js')) {
        $(el).attr('src', '/my-custom.js');
      }
    });

    res.send($.html());
  } catch (err) {
    res.status(500).send('Error fetching URL');
  }
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
