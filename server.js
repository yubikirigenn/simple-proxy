import express from "express";
import fetch from "node-fetch";
import * as cheerio from "cheerio"; // cheerio の default ではなく名前付きインポート
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

// __dirname を ES モジュールで使えるように
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ミドルウェア
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(compression());
app.use(express.static(path.join(__dirname, "public"))); // public フォルダに index.html 等を置く

// CroxyProxy 風フォームページ
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Simple Proxy</title>
        <style>
          body { font-family: Arial; margin: 50px; text-align: center; }
          input { width: 60%; padding: 10px; }
          button { padding: 10px 20px; }
        </style>
      </head>
      <body>
        <h1>Simple Proxy</h1>
        <form method="POST" action="/proxy">
          <input name="url" placeholder="Enter URL" required />
          <button type="submit">Go</button>
        </form>
      </body>
    </html>
  `);
});

// プロキシ処理
app.post("/proxy", async (req, res) => {
  try {
    const targetUrl = req.body.url;
    if (!targetUrl) return res.status(400).send("URL required");

    const response = await fetch(targetUrl);
    const contentType = response.headers.get("content-type");

    let body = await response.text();

    // HTML なら書き換え
    if (contentType && contentType.includes("text/html")) {
      const $ = cheerio.load(body);

      // 例: body の最後に一文追加
      $("body").append(`<p style="color:red;">-- Proxy Modified by SimpleProxy --</p>`);

      body = $.html();
    }

    res.set("Content-Type", contentType);
    res.send(body);
  } catch (err) {
    console.error(err);
    res.status(500).send("Proxy Error");
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
