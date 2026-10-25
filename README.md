# HCM Lite frontend

Next.js 15 App Router application. Installation, first-run company setup, local database options, API configuration, role workflows, tests and deployment instructions are in [the project README](../../README.md).

```sh
npm install
npm run dev
```

The backend must be running on port 4000. Override its address with the server-only API_URL setting in .env.local. The browser always uses same-origin /api requests and HTTP-only session cookies.
