# Logistics Map App

This project demonstrates draggable client and driver forms with a Leaflet map. A small Node.js server generates a unique CSP nonce for each request and serves the static files.

## Requirements

- Node.js 18+

## Setup

Install dependencies and start the development server:

```bash
npm install
npm start
```

Open <http://localhost:3000> in your browser.

## Security

The server generates a cryptographically strong nonce for each response and injects it into the HTML, providing a strict Content Security Policy. User data is handled entirely on the client; in production consider adding server-side validation and storage.


## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on creating issues, opening pull requests, coding style, and running tests.
