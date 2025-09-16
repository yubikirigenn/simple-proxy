import express from 'express';
import fetch from 'node-fetch';
import { load } from 'cheerio';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static('public')); // index.html置き場

// プロキシ
app.get('/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('URL required');

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' } // 簡易制限回避
    });
    let body = await response.text();

    // HTML書き換え
    const $ = load(body);

    // リンク書き換え
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http')) {
        $(el).attr('href', `/proxy?url=${encodeURIComponent(href)}`);
      }
    });

    // JS差し替え（例）
    $('script[src]').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.includes('example.js')) {
        $(el).attr('src', '/my-custom.js');
      }
    });

    res.send($.html());
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching URL');
  }
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
