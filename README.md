# LUMI.SHOP — Jewel Lister

Photograph a piece of jewelry, get real-world measurements, have AI write the listing, and save it as a Shopify draft product.

## Features

- **Measure from a photo**: calibrate with a printed ArUco mat (`/mat`), a sheet of paper or a credit card, then measure size, ring diameter and bead count.
- **On-screen ruler**: calibrate your screen, then size a ring by laying it on the display.
- **Segmentation in the browser** with SlimSAM (`@huggingface/transformers`); nothing is uploaded for measuring.
- **AI listing**: title, description, price hints, SEO fields and tags, written in a brand voice you define in `skills/`.
- **AI product images** (optional) from your photos.
- **Shopify**: OAuth install, then save the listing as a draft product with images.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in AUTH_SECRET at minimum
npm run dev
```

Open http://localhost:3000. Without Shopify or AI keys the measuring tools still work; the listing and Shopify buttons tell you what is missing.

```bash
npm test         # unit tests
npm run build    # production build
```

## Configuration

All settings are environment variables; see [`.env.example`](.env.example) for the full list.

| Area | Variables |
| --- | --- |
| Sessions (required) | `AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `APP_URL` |
| Database | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` (libSQL/Turso; defaults to `local.db`) |
| Shopify | `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, optional `SHOPIFY_SCOPES`, `SHOPIFY_API_VERSION` |
| AI | Vercel AI Gateway (automatic on Vercel, or `AI_GATEWAY_API_KEY`); or `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` directly |

### Shopify app

Create an app in the Shopify Partner Dashboard and set:

- App URL: `https://<your-domain>`
- Allowed redirect URL: `https://<your-domain>/api/shopify/callback`

### Brand voice

`skills/holly-zhang/SKILL.md` is a placeholder. Replace it (plus optional `references/*.md`) with your own voice, pricing and SEO rules, or point `HOLLY_SKILL_DIR` at another folder.

## Deploy

Built for Vercel (Next.js). Import the repo, add the environment variables, deploy.

## License

[MIT](LICENSE). Bundled third-party code: see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
