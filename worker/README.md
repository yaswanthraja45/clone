# AI backend

This directory contains the server-side AI endpoint for the GitHub Pages frontend.

## Deploy

1. Install Wrangler: `npm install -g wrangler`
2. Log in: `wrangler login`
3. From this directory run: `wrangler deploy`
4. Set the secret: `wrangler secret put OPENAI_API_KEY`
5. Set `ALLOWED_ORIGIN` in `wrangler.toml` to the exact GitHub Pages origin.

The OpenAI key is a Worker secret and is never shipped to the browser.

The frontend currently calls `/api/chat` while developing locally. For GitHub Pages, set the API endpoint in `src/ai-widget.ts` to the deployed Worker URL, for example `https://boolean-logic-ai.<your-subdomain>.workers.dev`.
