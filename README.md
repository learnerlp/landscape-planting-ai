# Landscape Planting AI

AI-assisted landscape planting drawing generator built with Next.js.

## Environment

Create a local environment file before running or deploying:

```bash
cp .env.example .env.local
```

Then replace the placeholder value with your own OpenAI API key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Never commit `.env.local` or any real API key. The repository only includes
`.env.example` with a placeholder.

## Getting Started

Install dependencies and run the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deploy

For Vercel or another hosting provider:

1. Import the GitHub repository.
2. Set `OPENAI_API_KEY` in the hosting provider's environment variables.
3. Use the default Next.js build command:

```bash
npm run build
```

After pushing to GitHub, a source ZIP can be downloaded from:

```text
https://github.com/learnerlp/landscape-planting-ai/archive/refs/heads/main.zip
```

If a deployment branch is used, replace `main` in the URL with that branch name.

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` creates a production build.
- `npm run start` starts the production server after building.
- `npm run lint` runs ESLint.
