This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Google Cloud Run

To deploy this application to Google Cloud Run:

1. **Build and Trigger**: Pushing to the `main` branch on GitHub automatically triggers a build in Google Cloud Build which builds the standalone Docker container and deploys it.
2. **Environment Variables**: Make sure to configure the following environment variables in your Cloud Run service configuration (*Edit & Deploy New Revision > Variables & Secrets*):

   | Variable Name | Description / Value |
   | --- | --- |
   | `GEMINI_API_KEY` | Your Google Gemini API Key |
   | `PINECONE_API_KEY` | Your Pinecone database API Key |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
   | `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Firebase Database URL |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
   | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Firebase Measurement ID |
   | `DATABASE_URL` | Prisma SQLite database url (e.g. `file:./dev.db`) |

