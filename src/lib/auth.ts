// Only these email domains may sign in.
// Override with NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS (comma-separated).
export const ALLOWED_EMAIL_DOMAINS = (
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS || 'student.uniten.edu.my'
)
  .split(',')
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean)

// OAuth provider used on the login page. Change to 'azure' to use
// Microsoft 365 (UNITEN student emails are hosted on Microsoft 365).
export const OAUTH_PROVIDER = 'google' as const

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false
  const domain = email.toLowerCase().split('@')[1]
  return !!domain && ALLOWED_EMAIL_DOMAINS.includes(domain)
}