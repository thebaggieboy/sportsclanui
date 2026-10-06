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

## SportsClan web app

The web app shares the Django API with the SportsClan mobile app. In development, start the backend at `http://127.0.0.1:8000` and the frontend at `http://localhost:3000`. Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to override the API base URL (include `/api/v1`). Production defaults to the deployed SportsClan API; configure the backend `CORS_ALLOWED_ORIGINS` to allow the deployed website origin.

The app provides account sign-in and registration, tournament browsing and creation, player rosters, FIFO waitlist offers, host editing/cancellation/announcements, player profiles and completed-game history, trust-and-safety reports, and in-app notifications. Paid tournaments are paused until organizer payouts are supported; free games remain available. Venue selection and tournament browsing use OpenStreetMap without a Google Maps API key. Map users can opt into browser GPS while a map is open; the map displays current location, nearby game pins, distance, and a rough drive-time estimate. Distance and time are calculated on-device from straight-line distance (30 km/h assumption); no GPS coordinates are sent to a routing service. Browser location requires permission and HTTPS (localhost is allowed for development); location is not tracked in the background, and the estimate does not include roads, live traffic, or turn-by-turn navigation.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
