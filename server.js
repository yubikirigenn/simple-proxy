import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import axios from 'axios';
import cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;

// 静的ファイル
app.use(express.static(path.join(__dirname, 'public')));

// プロキシ対象
app.get('/proxy/*', async (req, res) => {
    const targetUrl = req.url.replace(/^\/proxy\//, '');
    if (!/^https?:\/\//.test(targetUrl)) {
        res.status(400).send('Invalid URL');
        return;
    }

    try {
        const response = await axios.get(targetUrl, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'] || '';

        if (contentType.includes('text/html')) {
            // HTML書き換え
            const html = response.data.toString('utf8');
            const $ = cheerio.load(html);

            // リンク書き換え
            $('a, link, script, img, iframe').each((i, el) => {
                const attr = el.name === 'script' || el.name === 'img' || el.name === 'iframe' ? 'src' : 'href';
                const val = $(el).attr(attr);
                if (val && !val.startsWith('http') && !val.startsWith('data:')) {
                    $(el).attr(attr, new URL(val, targetUrl).href.replace(/^/, '/proxy/'));
                } else if (val && val.startsWith('http')) {
                    $(el).attr(attr, '/proxy/' + val);
                }
            });

            res.send($.html());
        } else {
            // HTML以外はそのまま返す
            res.set('Content-Type', contentType);
            res.send(response.data);
        }
    } catch (err) {
        res.status(500).send('Error fetching target: ' + err.message);
    }
});

// その他は index.html を返す
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`yubikiri-proxy running on port ${PORT}`);
});
