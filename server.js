import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';   // ← ここを修正！
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).send('URL required');

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'] || 'text/html';

    if (contentType.includes('text/html')) {
      const html = response.data.toString('utf-8');
      const $ = cheerio.load(html);

      // タイトルを書き換える
      $('title').text('yubikiri-proxy - ' + $('title').text());

      res.send($.html());
    } else {
      res.set('Content-Type', contentType).send(response.data);
    }
  } catch (err) {
    res.status(500).send(err.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
