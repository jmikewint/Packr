This is the Packr frontend - a [Next.js](https://nextjs.org) app bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). It has no database of its own; it's purely a client to three backend services.

## Backend services

This app calls three separate Packr backends over HTTP. All three need to be running locally for the app to work fully (though each page degrades gracefully - with a visible error state - if the service it depends on is down):

| Service | Default URL | Used by |
|---|---|---|
| catalog-service | `http://localhost:4001` | Browse, card detail, Add Card |
| auth-service | `http://localhost:4002` | Signup, login, session restore |
| pricing-service | `http://localhost:4003` | "Get AI Price Estimate" on card detail |

Configure these via env vars (see `.env.local`, already set to the defaults above):

```
NEXT_PUBLIC_CATALOG_URL=http://localhost:4001
NEXT_PUBLIC_AUTH_URL=http://localhost:4002
NEXT_PUBLIC_PRICING_URL=http://localhost:4003
```

They're `NEXT_PUBLIC_*` because every API call in this app is made client-side (browser fetch, using a JWT from localStorage) - none of it runs server-side in Next.js.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
