import express from 'express';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio'; // ← 修正
import { URL } from 'url';


const app = express();
const PORT = process.env.PORT || 10000;

// 静的ファイル配信（UI用）
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// URLエンコード済みのリソースもプロキシ
function makeProxyURL(originalURL) {
  return `/proxy?url=${encodeURIComponent(originalURL)}`;
}

// メインプロキシ
app.get('/proxy', async (req, res) => {
  const target = req.query.url;
  if (!target) return res.send("URLを指定してください。例: /proxy?url=https://example.com");

  try {
    const response = await fetch(target);
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('text/html')) {
      // HTMLの場合
      const html = await response.text();
      const $ = cheerio.load(html);

      // aタグの書き換え
      $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !href.startsWith('#')) {
          try {
            const absUrl = new URL(href, target).href;
            $(el).attr('href', makeProxyURL(absUrl));
          } catch {}
        }
      });

      // リソース書き換え (画像, script, link)
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
          try {
            const absUrl = new URL(src, target).href;
            $(el).attr('src', makeProxyURL(absUrl));
          } catch {}
        }
      });

      $('script').each((i, el) => {
        const src = $(el).attr('src');
        if (src) {
          try {
            const absUrl = new URL(src, target).href;
            $(el).attr('src', makeProxyURL(absUrl));
          } catch {}
        }
      });

      $('link[rel="stylesheet"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          try {
            const absUrl = new URL(href, target).href;
            $(el).attr('href', makeProxyURL(absUrl));
          } catch {}
        }
      });

      res.send($.html());
    } else {
      // HTML以外はバイナリとして返す
      const buffer = await response.arrayBuffer();
      res.set('Content-Type', contentType || 'application/octet-stream');
      res.send(Buffer.from(buffer));
    }
  } catch (e) {
    res.send("アクセスできません: " + e.message);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

