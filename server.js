import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 10000;

// フォーム画面
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>yubikiri-proxy</title>
      </head>
      <body>
        <h1>yubikiri-proxy</h1>
        <form id="proxyForm" action="/proxy" method="GET">
          <input type="text" name="url" placeholder="https://example.com" size="50"/>
          <button type="submit">GO</button>
        </form>
        <script>
          document.getElementById('proxyForm').addEventListener('submit', e => {
            e.preventDefault();
            const url = e.target.url.value;
            window.location.href = '/proxy/' + encodeURIComponent(url);
          });
          // EnterでGO
          document.querySelector('input[name="url"]').addEventListener('keypress', e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              document.getElementById('proxyForm').dispatchEvent(new Event('submit'));
            }
          });
        </script>
      </body>
    </html>
  `);
});

// プロキシ
app.get('/proxy/:url(*)', async (req, res) => {
  try {
    const targetUrl = decodeURIComponent(req.params.url);
    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': '*/*'
      }
    });

    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      const html = response.data.toString('utf8');
      const $ = load(html);

      // HTML内のリンクを書き換え
      $('a, link, script, img, iframe').each((i, el) => {
        const attr = el.name === 'script' || el.name === 'img' || el.name === 'iframe' ? 'src' : 'href';
        const val = $(el).attr(attr);
        if (val && !val.startsWith('http') && !val.startsWith('data:')) {
          $(el).attr(attr, new URL(val, targetUrl).href.replace(/^/, '/proxy/'));
        } else if (val && val.startsWith('http')) {
          $(el).attr(attr, '/proxy/' + encodeURIComponent(val));
        }
      });

      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send($.html());
    } else {
      // HTML以外はバイナリでそのまま返す
      res.set('Content-Type', contentType);
      res.send(response.data);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Proxy Error: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`yubikiri-proxy running on port ${PORT}`);
});
