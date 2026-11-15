# Phase 2: existing Supabase role model

The live project already contains `clubs`, `members`, `transactions`, and `audit_log`. Phase 2 now uses those tables instead of introducing a duplicate membership table.

## Roles

- `admin`: all clubs; read/write/export
- `treasurer`: assigned club; read/write/export
- `auditor`: assigned club; read/export
- `viewer`: assigned club; read only

The legacy `president` enum value is preserved for compatibility but is not part of the new treasury permission model.

## Rollout

1. Apply `20261115_phase2_prepare.sql`. It adds the viewer enum value, seeds the existing clubs from transaction data, adds indexes, narrows grants, and hardens callable functions. It does **not** replace transaction RLS.
2. Create at least one `members` row with `role='admin'` and `club_id = null`.
3. Add club-specific treasurer/auditor/viewer memberships using the matching `clubs.id`.
4. Only after memberships exist, apply `20261115_phase2_enforce.sql`.
5. Test all four roles before merging/deploying the GitHub branch.

Do not guess administrator identity. There are currently authenticated users in Supabase but no membership rows, so enforcement before assigning an admin would intentionally deny all application access.
