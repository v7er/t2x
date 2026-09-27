# T2x

Master time. Send it toward the spans of a life.

Rounds, a daily check-in, and a calendar live in the browser. Nothing is sent to a server.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:8080.

## Deploy

Production runs on Cloudflare Workers.

```bash
npx wrangler login
npm run deploy:cloudflare
```

Or push to `main`. GitHub Actions deploys when these repository secrets are set:

- `CLOUDFLARE_API_TOKEN` — Workers deploy permission
- `CLOUDFLARE_ACCOUNT_ID`
