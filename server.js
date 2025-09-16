import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静的ファイルを返す（index.htmlなど）
app.use(express.static(path.join(__dirname)));

// ルートにアクセスされたときに簡単なHTMLフォームを返す
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Simple Proxy</title></head>
      <body>
        <h2>URLを入力してください</h2>
        <form method="GET" action="/proxy">
          <input name="url" type="text" placeholder="https://example.com" size="50"/>
          <button type="submit">アクセス</button>
        </form>
      </body>
    </html>
  `);
});

// 簡易プロキシ機能
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.send('URLを入力してください');

  try {
    const response = await fetch(targetUrl);
    const text = await response.text();
    res.send(text);
  } catch (err) {
    res.send('エラー: ' + err.message);
  }
});

app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
