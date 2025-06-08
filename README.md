# Logistics Map App

This project demonstrates draggable client and driver forms with a Leaflet map. A small Node.js server generates a unique nonce for each request, injects it into the page's `Content-Security-Policy` header, and serves the static files.

## Requirements

- Node.js 18+

## Setup

Install dependencies and start the development server in the repository root:

```bash
# install dependencies
npm install

# start the server once packages are installed
npm start
```

Open <http://localhost:3000> in your browser.

## Security

The server generates a cryptographically strong nonce for each response. `server.js` uses `crypto.randomBytes` to create a 16‑byte value, inserts the nonce into the HTML, and sets a `Content-Security-Policy` header referencing it. User data is handled entirely on the client; in production consider adding server-side validation and storage.

