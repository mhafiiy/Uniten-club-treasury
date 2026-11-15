# UNITEN Smart Treasury

Role-based treasury management for authorized UNITEN student organizations.

## Access model

- **Admin** — view and manage all treasury records.
- **Treasurer** — view, create, edit, export, and void records for assigned clubs.
- **Auditor** — view and export records for assigned clubs.
- **Viewer** — read-only access for assigned clubs.

Authorization is enforced by Supabase Row Level Security (RLS). UI controls are not treated as the security boundary.

## Financial integrity

- Transaction amounts must be positive with at most two decimal places.
- Transactions cannot be hard-deleted by authenticated users.
- Voiding requires an authenticated user and a reason.
- Once voided, a transaction is immutable.
- Inserts and updates are written to the audit log.
- Voided transactions remain visible but are excluded from balances.

## Authentication

Sign-in is restricted to configured UNITEN email domains. The default allowed domain is:

```
student.uniten.edu.my
```

The app uses Supabase SSR cookie sessions and a Next.js proxy to refresh authentication tokens.

## Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS=student.uniten.edu.my
```

Never place a Supabase service-role or secret key in a `NEXT_PUBLIC_` variable.

## Development

```bash
npm ci
npm run lint
npm run build
npm run dev
```

## Database

The repository contains staged Supabase migrations under `supabase/migrations/`. The live project currently uses the existing `clubs`, `members`, `transactions`, and `audit_log` tables.

Do not apply old migrations blindly to another database. Review the schema and RLS policies first.

## Deployment checklist

1. GitHub Actions `Validate` must pass.
2. Confirm Supabase security advisors have no unresolved application-level warnings.
3. Verify at least one admin membership exists.
4. Test admin and non-admin access.
5. Verify OAuth callback URLs for the production domain.
6. Deploy only after build validation passes.
7. Test login, transaction creation/editing, CSV export, voiding, and sign-out in production.

## Current administrator bootstrap

The first admin is assigned in Supabase through the `members` table. Additional roles should be provisioned through trusted administrative database operations until a dedicated role-management interface is added.
