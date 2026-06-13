# GrowthHive OS

Internal CRM, invoice, and finance management system for PT. Growth Hive Indonesia. Built with Next.js 14, Tailwind CSS, Supabase, Gemini, and `@react-pdf/renderer`.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Until Supabase credentials are configured, the application starts empty and stores newly created records in the current browser.

The current temporary login is:

```text
Email: christopher@growthhive.id
Password: GrowthHive2026!
```

Set `TEMP_LOGIN_EMAIL`, `TEMP_LOGIN_PASSWORD`, and a long random `AUTH_SESSION_SECRET` in Vercel before production use. Until Supabase is connected, newly created CRM, invoice, and finance records are stored only in the current browser.

## Supabase setup

1. Create a Supabase project and run `supabase/migrations/001_initial_schema.sql` in the SQL editor.
2. Create a private Storage bucket named `bank-statements`.
3. Enable email/password authentication and create users in `public.users` with `admin`, `sales`, or `accounting` roles.
4. Add the project URL, anon key, and service role key to `.env.local`.
5. Create scheduled Edge Functions for overdue invoices and expiring contracts, using Resend for delivery.

## Environment variables

All required variables are documented in `.env.example`. Keep `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `RESEND_API_KEY` server-side only.

## Deploy to Vercel

Import the GitHub repository in Vercel, set the environment variables, and deploy. Add the Vercel domain to Supabase Authentication URL configuration.
