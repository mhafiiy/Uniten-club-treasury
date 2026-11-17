// Authentication admission is separate from Treasury role authorization.
export const ALLOWED_EMAIL_DOMAINS = ['student.uniten.edu.my'] as const
export const DESIGNATED_ADMIN_EMAIL = 'm.hafiiy@gmail.com'
export const OAUTH_PROVIDER = 'google' as const
// Volunteer Gmail authentication closes automatically on 24 November 2026 UTC.
export const VOLUNTEER_GMAIL_EXPIRES_AT = '2026-11-24T00:00:00Z'

export function isAllowedEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase()
  if (!normalized) return false
  return normalized === DESIGNATED_ADMIN_EMAIL ||
    ALLOWED_EMAIL_DOMAINS.some((domain) => normalized.endsWith('@' + domain)) ||
    (normalized.endsWith('@gmail.com') && Date.now() < Date.parse(VOLUNTEER_GMAIL_EXPIRES_AT))
}

export function isStudentEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase()
  return !!normalized && normalized.endsWith('@student.uniten.edu.my')
}
