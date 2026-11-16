// Login admission is distinct from database role authorization.
// Only the exact designated administrator Gmail account is excepted.
export const ALLOWED_EMAIL_DOMAINS = ['student.uniten.edu.my'] as const
export const DESIGNATED_ADMIN_EMAIL = 'm.hafiiy@gmail.com'
export const OAUTH_PROVIDER = 'google' as const

export function isAllowedEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase()
  if (!normalized) return false
  return normalized === DESIGNATED_ADMIN_EMAIL ||
    ALLOWED_EMAIL_DOMAINS.some((domain) => normalized.endsWith('@' + domain))
}

export function isStudentEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase()
  return !!normalized && normalized.endsWith('@student.uniten.edu.my')
}
