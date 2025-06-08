const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
// Serve static files from the repository root
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  const htmlPath = path.join(__dirname, 'index.html');
  fs.readFile(htmlPath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error loading page');
    const page = data.replace(/abc123/g, nonce);
    res.setHeader('Content-Security-Policy', `default-src 'self'; script-src 'self' https://unpkg.com 'nonce-${nonce}'; style-src 'self' https://unpkg.com 'nonce-${nonce}' 'unsafe-inline'; img-src 'self' data: https://*.tile.openstreetmap.org; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';`);
    res.send(page);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
