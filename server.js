import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// __dirname を作る
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 静的ファイルを配信
app.use(express.static(__dirname));

// 既存のプロキシ機能
app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Missing url parameter");
  }

  try {
    const response = await fetch(targetUrl);
    const body = await response.text();
    res.send(body);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});
