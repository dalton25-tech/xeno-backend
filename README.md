# XENO Backend

XENO AI cloud backend by DALTRON TECHNOLOGIES.

## Stack

- Node.js 20+
- TypeScript
- Hono
- Vercel Functions
- Provider adapter for OpenAI-compatible chat-completions APIs

## API

### `GET /api/health`

Returns service status and whether AI/auth environment variables are configured. It never returns secrets.

### `POST /api/chat`

Requires a bearer token and a JSON body:

```json
{
  "message": "Hello, XENO"
}
```

Successful response:

```json
{
  "output": "Hello. What would you like to work on?",
  "model": "configured-model"
}
```

Messages must contain 1–4,000 characters. The request body is limited to 16 KB.

## Environment variables

Copy `.env.example` to `.env` for local development and set:

- `AI_API_URL`: full OpenAI-compatible chat-completions endpoint URL
- `AI_API_KEY`: provider API key
- `AI_MODEL`: model identifier accepted by the provider
- `AI_SYSTEM_PROMPT`: optional assistant system prompt
- `XENO_API_TOKEN`: bearer token required by the initial development API
- `CORS_ORIGIN`: browser origin allowed by CORS; CORS is not authentication

Keep provider keys and tokens on the server. Never commit `.env` or embed provider keys in the Android application.

**Security limitation:** `XENO_API_TOKEN` is a temporary shared-token gate for private development. Do not embed it in a production APK: mobile application secrets can be extracted. Before public release, replace it with real user authentication and add rate limiting/abuse controls.

## Local development

Install Node.js 20 or later, then:

```bash
npm install
cp .env.example .env
npm run build
npm test
npm run dev
```

The Vercel development server exposes the API at `http://localhost:3000/api`.

## Deployment

Import this GitHub repository into Vercel. Vercel detects the Hono API entrypoint at `api/index.ts`. Configure environment variables in Vercel Project Settings before enabling chat.

After deployment, verify:

- `https://YOUR-DEPLOYMENT.vercel.app/api/health`
- `POST https://YOUR-DEPLOYMENT.vercel.app/api/chat`

## Current scope

This first backend foundation does not yet provide database-backed conversation history, user accounts, long-term cloud memory, streaming responses, or production-grade abuse protection. Those are separate implementation milestones.
