# Phase 2: Treasury access control

**Do not deploy the Phase 2 branch until the database migration is reviewed and applied.** The dashboard now fails closed if no membership exists. It intentionally denies access to unprovisioned users.

## Roles
- **administrator**: all clubs, read/write/export
- **club_treasurer**: read/write/export only for assigned club
- **auditor**: read/export only for assigned club
- **viewer**: read only for assigned club (no export button in a future UI iteration)

## Setup
1. Back up Supabase. Inspect the current `public.transactions` schema and all existing RLS policies. The SQL assumes `club_name` and `user_email` text columns and an existing `public.transactions` table.
2. Review `supabase/migrations/20261115_treasury_roles.sql`. It removes existing transactions policies; check for other applications that depend on them.
3. Apply the migration in a controlled environment. It creates `treasury_memberships` and scoped transaction policies.
4. Add the initial administrator through Supabase SQL Editor using their `auth.users.id`. Never grant administrator based solely on email domain.
5. Add club-specific memberships with club names matching `transactions.club_name` exactly.
6. Test with four accounts and verify a treasurer cannot view or modify another club's records; verify auditors/viewers cannot mutate records.
7. Review legacy `index.html`: it is not protected by Next.js and should not be deployed. Remove or isolate it before production.

## Known limitations
- Existing transactions lacking `club_name` are not visible to non-administrators.
- The application still has a hardcoded list of clubs; roles with names outside that list cannot create records until club management is migrated to the database.
- UI checks are not a security boundary. Database RLS must be deployed and verified.
- This branch has not been built or tested against a live Supabase instance.
- Export permission is currently UI-level only; a user with read access can retrieve permitted rows through the API. For strict export restrictions, expose only an approved summary to viewers rather than raw transactions.
